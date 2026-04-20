import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="curtain-left"></div>
      <div className="curtain-right"></div>
      <div className="header-content">
        <div className="marquee-lights">
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
        </div>
        <h1 className="title">Movie Night Finder</h1>
        <p className="subtitle">Find the perfect movie for you & your love</p>
        <div className="marquee-lights">
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
          <span className="light"></span>
        </div>
      </div>
    </header>
  );
}

export default Header;
