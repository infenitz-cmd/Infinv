import { Zap, ShieldCheck, Heart } from 'lucide-react';

export const FeatureBadges: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Fast',
      desc: 'Quick & secure access',
      bgColor: 'bg-blue-100/70',
      iconColor: 'text-blue-600',
    },
    {
      icon: ShieldCheck,
      title: 'Secure',
      desc: 'Your data, our priority',
      bgColor: 'bg-emerald-100/70',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Heart,
      title: 'Reliable',
      desc: 'Always here for you',
      bgColor: 'bg-purple-100/70',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full pt-4 border-t border-slate-200/50">
      {features.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl transition-all duration-200 hover:bg-white/60">
            <div className={`w-11 h-11 rounded-full ${item.bgColor} ${item.iconColor} flex items-center justify-center mb-2 shadow-sm transition-transform duration-200 hover:scale-105`}>
              <IconComponent className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{item.title}</span>
            <span className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 max-w-[100px]">
              {item.desc}
            </span>
          </div>
        );
      })}
    </div>
  );
};
