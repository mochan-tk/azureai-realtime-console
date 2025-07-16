export default function Button({ icon, children, onClick, className }) {
  return (
    <button
      className={`bg-gray-800 text-white rounded-full p-2 md:p-4 flex items-center gap-1 hover:opacity-90 text-sm md:text-base whitespace-nowrap ${className}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
