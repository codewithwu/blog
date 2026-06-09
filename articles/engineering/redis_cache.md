# Redis 缓存的三种典型问题:雪崩、击穿、穿透——成因、方案与边界

> 关键词:Redis、缓存穿透、缓存击穿、缓存雪崩、布隆过滤器、互斥锁、逻辑过期、缓存一致性

## 〇、写在前面

缓存的三种典型故障——雪崩、击穿、穿透——不是"加一层 set/get"的问题,而是**在过期、并发、非法访问三种压力下,缓存与数据库分别承担多少负载**。本文按"成因 → 方案 → 边界"的顺序展开,每个方案都会指出它在哪些场景成立、哪些场景失效。

文末还会补一节"被三大问题掩盖的两个前置议题":缓存一致性、热 Key 探测,它们往往才是踩坑的根因。

---

## 一、缓存雪崩(Cache Avalanche)

### 1.1 场景

某内容社区首页推荐流,缓存 100 万篇文章,每篇 TTL = 1 小时。预热时同一时刻批量写入:

```java
// 错误写法:固定 TTL
for (Article article : articleList) {
    redis.set("article:" + article.getId(), article, 3600);
}
```

一小时后这 100 万个 key 同时过期,叠加业务高峰,DB QPS 瞬间上涨数倍——关键不是"key 数量大",而是"过期时刻集中 + 业务流量本身就高"。如果换成凌晨 2 点过期、流量低谷,DB 一般能扛。

### 1.2 雪崩的两层定义

| 层级 | 定义 |
|------|------|
| 狭义 | 大量 Key 在同一时刻物理过期,流量穿透到 DB |
| 广义 | Redis 实例宕机 / 网络分区导致缓存整体不可用 |

两者解法不同:狭义靠**打散过期时间**,广义靠**缓存层高可用**。

### 1.3 方案

#### 方案一:随机 TTL(默认必做)

```java
// 基础 TTL 3600s + 0~600s 随机偏移
int baseTtl = 3600;
int jitter = ThreadLocalRandom.current().nextInt(600);
redis.setex(key, baseTtl + jitter, value);
```

成本最低、收益最高的一招。任何批量预热场景都应该默认带上。

#### 方案二:逻辑过期 + 异步刷新(高 QPS 场景)

缓存本身不设短 TTL,而是在 value 里带一个 `logicalExpireTime`,后台线程提前刷新:

```java
class CacheValue<V> {
    private V data;
    private long logicalExpireTime; // 毫秒时间戳
}

// 后台扫描即将过期的热 key,提前异步刷新
@Scheduled(fixedDelay = 60_000)
public void refreshHotKeys() {
    for (String key : hotKeySet) {
        CacheValue<?> val = redis.get(key);
        if (val.getLogicalExpireTime() - System.currentTimeMillis() < 5 * 60 * 1000) {
            asyncLoadAndSet(key);
        }
    }
}
```

**边界**:逻辑过期的 key 不会被 Redis 自动回收,需要兜底——业务下线时主动 DEL,或在 value 上再加一个**远大于逻辑过期的物理 TTL**(比如逻辑过期 30 分钟、物理 TTL 24 小时),避免遗留垃圾数据。

#### 方案三:缓存层高可用(应对广义雪崩)

- **Redis Cluster**:分片存储,单分片故障不影响整体。
- **多级缓存**:Caffeine(JVM 内本地) + Redis(分布式)。本地缓存 TTL 应该比 Redis 更短,避免 Redis 已更新而本地还读旧值。多实例间的本地缓存失效传播需要单独设计(广播失效消息、或接受短暂不一致)。

---

## 二、缓存击穿(Cache Breakdown)

### 2.1 场景

电商大促,某个热门 SKU 的 QPS 达到 2 万,缓存 TTL = 30 分钟。

整点过期的瞬间,大量请求同时发现缓存为空,同时去查 DB——**关键特征:同一个 Key + 高并发 + 失效瞬间**。

跟雪崩的区别:雪崩是"很多 key 同时过期",击穿是"一个 key 过期但被高并发命中"。

### 2.2 方案

#### 方案一:互斥锁(经典做法)

```java
public Sku getSku(Long id) {
    String cacheKey = "sku:" + id;
    Sku sku = redis.get(cacheKey);
    if (sku != null) return sku;

    String lockKey = "lock:sku:" + id;
    String token = UUID.randomUUID().toString(); // 锁的持有者标识

    // 一条命令保证原子性:SET key value NX EX seconds
    Boolean locked = redis.set(lockKey, token, "NX", "EX", 10);

    if (Boolean.TRUE.equals(locked)) {
        try {
            // 双重检查,避免重复回源
            sku = redis.get(cacheKey);
            if (sku == null) {
                sku = db.queryById(id);
                redis.setex(cacheKey, 1800, sku);
            }
            return sku;
        } finally {
            // 用 Lua 校验 token 后再删除,避免误删其他线程的锁
            releaseLockByLua(lockKey, token);
        }
    }

    // 没拿到锁:有界重试 + 退避
    for (int i = 0; i < 5; i++) {
        Thread.sleep(50);
        sku = redis.get(cacheKey);
        if (sku != null) return sku;
    }
    // 兜底:重试仍未命中,降级查 DB(由上游限流保护)
    return db.queryById(id);
}
```

四个容易被忽略的点:

1. **加锁必须用 `SET ... NX EX` 一条命令**。`setnx` + `expire` 两条命令在客户端崩溃时会留下永久锁,这是事故重灾区。
2. **锁要带 owner token**,释放时用 Lua 校验。否则 A 线程的锁在过期后被 B 线程重入,A 业务完成时会误删 B 的锁。
3. **不要用递归重试**,改为有界循环 + 兜底降级,避免栈溢出。
4. 业务执行时间可能超过锁 TTL。生产环境建议直接用 **Redisson** 的分布式锁,它内置了看门狗机制,在业务执行期间自动续约。

#### 方案二:逻辑过期(无锁、高吞吐)

缓存物理上不过期(或物理 TTL 远大于逻辑 TTL),value 携带 `logicalExpireTime`,过期后由一个线程异步刷新,其他线程继续返回旧值:

```java
public Sku getSkuLogicalExpire(Long id) {
    String cacheKey = "sku:" + id;
    CacheWrapper<Sku> wrapper = redis.get(cacheKey);
    if (wrapper == null) return null; // 不在缓存里(首次访问或被清理)

    Sku sku = wrapper.getData();
    if (System.currentTimeMillis() < wrapper.getLogicalExpireTime()) {
        return sku;
    }

    // 已过期:只让一个线程去刷新
    String lockKey = "lock:refresh:" + id;
    String token = UUID.randomUUID().toString();
    if (Boolean.TRUE.equals(redis.set(lockKey, token, "NX", "EX", 2))) {
        refreshExecutor.submit(() -> {
            try {
                Sku newSku = db.queryById(id);
                CacheWrapper<Sku> newWrapper = new CacheWrapper<>(
                    newSku, System.currentTimeMillis() + 1800_000
                );
                redis.set(cacheKey, newWrapper); // 物理 TTL 由统一策略兜底
            } finally {
                releaseLockByLua(lockKey, token);
            }
        });
    }
    return sku; // 返回旧值,容忍短暂不一致
}
```

**适用场景**:对一致性要求不高、对可用性要求极高,例如商品详情页、配置类数据。

**注意**:异步刷新要用业务自己的线程池,不要用 `CompletableFuture.runAsync` 的默认 ForkJoinPool——它是 JVM 公共池,被慢任务堵塞会影响整个进程的并行流计算。

---

## 三、缓存穿透(Cache Penetration)

### 3.1 场景

开放接口 `/api/order/{id}` 被脚本扫描,攻击者枚举 1000000 ~ 2000000,其中 90% 的订单不存在。每个请求都查不到缓存,落到 DB 上走主键查询,DB CPU 持续高位。

**本质**:请求的数据在缓存和 DB 中都不存在,缓存层失去拦截作用。

### 3.2 方案

#### 方案一:缓存空对象(快速兜底)

```java
public Result getOrder(String orderId) {
    String cacheKey = "order:" + orderId;
    Object cached = redis.get(cacheKey);

    if (cached instanceof NullValue) {
        return Result.error("订单不存在");
    }
    if (cached != null) {
        return Result.success(cached);
    }

    Order order = db.query(orderId);
    if (order == null) {
        // 空对象 TTL 要短(30~60s),避免长期占用内存
        redis.setex(cacheKey, 60, new NullValue());
        return Result.error("订单不存在");
    }

    redis.setex(cacheKey, 1800, order);
    return Result.success(order);
}
```

**适用**:攻击规模不大、合法 ID 的稀疏度可控。如果攻击者枚举范围非常大,空对象本身会占用大量 Redis 内存,这时需要布隆过滤器。

#### 方案二:布隆过滤器(应对大规模枚举)

**原理**:用 bitmap 预存所有合法 key,请求先查布隆,不存在则直接拦截,不再访问 Redis 或 DB。

**布隆的两个性质**:
- 说"不存在" → 一定不存在(无假阴性)
- 说"存在" → 可能不存在(有假阳性,概率可调)

```java
// Redisson RBloomFilter:数据落在 Redis,多实例共享
RBloomFilter<String> bloom = redisson.getBloomFilter("orderIdBloom");
bloom.tryInit(100_000_000L, 0.01); // 预期 1 亿条,误判率 1%

// 预热:把所有合法 id 写入
for (Long id : allValidIds) {
    bloom.add("order:" + id);
}

public Order getOrder(Long id) {
    String key = "order:" + id;
    if (!bloom.contains(key)) {
        return null; // 一定不存在,直接拦截
    }
    Order order = redis.get(key);
    if (order == null) {
        order = db.query(id);
        if (order != null) {
            redis.setex(key, 600, order);
        } else {
            // 布隆假阳性兜底:缓存空对象
            redis.setex(key, 60, new NullValue());
        }
    }
    return order;
}
```

**为什么不用 Guava 的 BloomFilter**:Guava 是单机内存实现,多实例之间数据不一致——A 实例预热了某个 id,B 实例查不到。生产应该用 **Redisson 的 RBloomFilter** 或 **Redis 的 RedisBloom 模块**,数据存在 Redis 上,所有应用实例共享。

**容量规划**:1 亿条 + 1% 误判率,约需 `1亿 × 9.6 bit ≈ 120 MB`。

**两个隐藏陷阱**:
1. **标准布隆不支持删除**。如果业务允许删数据(用户注销、订单作废),被删 id 仍会被判为"存在",假阳性率会持续上升。解决办法:用 **Counting Bloom Filter**,或者定期(如每日)全量重建。
2. **预热要在上线前完成**。半预热状态会让合法请求被误拦,通常配合"双写布隆"或灰度预热。

#### 方案三:网关层拦截

布隆和空对象都是数据层防御,网关层还可以做参数校验和限流,挡掉明显异常的请求:

```java
@GetMapping("/order/{id}")
public Result getOrder(@PathVariable String id) {
    if (!StringUtils.isNumeric(id) || id.length() > 20) {
        return Result.error("非法参数");
    }
    if (!rateLimiter.tryAcquire()) {
        return Result.error("请求过快");
    }
    // ...
}
```

---

## 四、对比表

| 维度 | 雪崩 | 击穿 | 穿透 |
|------|------|------|------|
| 英文 | Avalanche | Breakdown | Penetration |
| 触发条件 | 大量 Key 同一时刻过期 | 单个热 Key 过期瞬间 | 请求 DB 和缓存都不存在的数据 |
| 影响面 | 全局缓存层 | 单个或少数热 Key | 不定,与攻击规模相关 |
| 主要应对 | 随机 TTL + 高可用 | 互斥锁 / 逻辑过期 | 布隆 / 空对象 / 网关拦截 |
| 主要副作用 | 无明显 | 锁等待 / 短暂不一致 | 布隆假阳性 / 空对象占用内存 |

---

## 五、被三大问题掩盖的两个前置议题

只关注雪崩、击穿、穿透,容易忽略两个更基础的问题。

### 5.1 缓存与 DB 的一致性

三大问题讨论的都是"缓存失效后怎么办",但**缓存与 DB 的数据一致性**才是缓存设计的核心——线上数据不一致的事故,根因往往不是缓存崩了,而是写流程设计有问题。

常见的写策略:

- **Cache Aside(最常用)**:更新 DB 后删缓存。要警惕"读旧值后回写"覆盖新值的并发问题,常用"延迟双删"或订阅 DB binlog 异步删缓存来兜底。
- **Write Through / Write Behind**:由缓存层代理写 DB。实现复杂,适合 K-V 形态数据。
- **Read Through**:读未命中时由缓存层自动回源,业务代码更干净,但需要缓存中间件支持。

如果业务对一致性敏感(余额、库存),建议单独写一篇细聊,本文不展开。

### 5.2 热 Key 探测

上面的逻辑过期方案假设"已经知道哪些是热 Key",但生产里**怎么发现热 Key**本身就是个问题。常见手段:

- **客户端采样**:在客户端 SDK 里按一定概率上报访问的 key,聚合后识别 TopN。
- **Redis 服务端**:`redis-cli --hotkeys`(要求 maxmemory-policy 为 LFU 系列),或 `MONITOR` 抓样本(注意 MONITOR 对性能有影响,只能短时间使用)。
- **专用中间件**:京东开源的 **JD-hotkey**,基于 Netty + etcd 做实时热点探测和本地缓存推送。

热 Key 一旦被识别,通常做法是:本地缓存抗尖刺 + 单独配置更长 TTL + 多副本分片(把 `key` 拆成 `key#0`、`key#1`…分散到不同分片)。

---

## 六、推荐组合

| 场景 | 推荐方案 |
|------|----------|
| 普通业务查询 | 随机 TTL + 空对象缓存 + 参数校验 |
| 热点数据(商品详情、配置) | 逻辑过期(无锁)或 Redisson 互斥锁 |
| 存在恶意枚举攻击 | Redisson RBloomFilter,每天离线重建 |
| 缓存层高可靠 | Redis Cluster + Caffeine 本地缓存 |
| 极限流量防护 | 网关限流 + 熔断降级(Sentinel / Resilience4j) |

---

## 七、写在最后

设计缓存时反复问自己一个问题:**当缓存不存在时,我的数据库能扛住吗?**

如果答案是不能,就回到上面的方案里挑组合。三条经验:

1. 不依赖单一 TTL —— 加随机、加逻辑过期、加多级缓存。
2. 不假设所有请求都合法 —— 上布隆或空对象。
3. 热 Key 单独处理 —— 探测 + 本地缓存 + 多副本。

雪崩、击穿、穿透是缓存层的常见故障模式,但**缓存一致性**和**热 Key 探测**才是真正决定系统稳态的前置工程。
