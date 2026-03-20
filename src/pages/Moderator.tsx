import ModeratorPanel from '@/components/ModeratorPanel';
import Icon from '@/components/ui/icon';

export default function Moderator() {
  return (
    <div>
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🚀</span>
              </div>
              <div className="leading-tight">
                <span className="font-bold text-[#3AAD46] text-base tracking-wide">SPACE</span>
                <span className="font-bold text-[#1B6B2A] text-base tracking-wide ml-1">WORK</span>
              </div>
            </div>
          </a>
          <div className="flex items-center gap-1 text-gray-400 ml-1">
            <Icon name="ChevronRight" size={14} />
            <span className="text-sm text-gray-500 font-medium">Модерация</span>
          </div>
        </div>
      </div>
      <ModeratorPanel />
    </div>
  );
}
