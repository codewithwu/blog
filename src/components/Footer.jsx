// 底部版权信息
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-brand-mid/20 py-8 text-center text-sm text-brand-mid">
      <p>© {new Date().getFullYear()} 极客熊猫 · Built with React + Vite</p>
    </footer>
  );
}
