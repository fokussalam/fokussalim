import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

// Simple Hijri date conversion
const toHijri = (date: Date) => {
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban',
    'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'
  ];
  
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  
  let jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
           Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
           Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
           d - 32075;
  
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;
  
  return `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear} H`;
};

interface AppHeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  showMenuButton?: boolean;
  title?: string;
}

export const AppHeader = ({ 
  onMenuClick, 
  isMenuOpen = false,
  showMenuButton = true,
  title
}: AppHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}, ${dateNum} ${month} ${year}`;
  };

  const formatHijri = (date: Date) => {
    return toHijri(date);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds} WIB`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left side: Logo and title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-6 bg-red-accent rounded-full" />
          <h1 className="text-lg font-bold text-foreground">
            {title || <>Fokus <span className="text-red-accent">Salim</span></>}
          </h1>
        </div>

        {/* Center: Date and Time */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-foreground truncate">
            {formatDate(currentTime)} / {formatHijri(currentTime)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Right side: Menu button */}
        {showMenuButton && onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors shrink-0"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-9" /> // Spacer for layout balance
        )}
      </div>
    </header>
  );
};

export default AppHeader;
