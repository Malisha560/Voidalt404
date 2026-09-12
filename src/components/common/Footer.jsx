function Footer() {
  return (
    <footer className="relative h-[130px] overflow-hidden bg-white">

      {/* Wave */}
      <div className="absolute bottom-0 left-0 h-[55px] w-full bg-[#eeeafb]">
        <div className="absolute -top-[20px] left-[-5%] h-[40px] w-[110%] rounded-[50%] bg-[#f4f2fc]" />
      </div>

      {/* Tiny logo */}
      <img
        src="/exora-logo.svg"
        alt="Exora Logo"
        className="absolute bottom-3 left-4 z-10 !w-[35px] !max-w-[35px] !h-auto"
      />

      {/* Center text */}
      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs text-[#635d91]">
        © 2026 Exora. Privacy Policy | Copyright Policy
      </p>

    </footer>
  );
}

export default Footer;