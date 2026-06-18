type Props = {
  total: number;
  inProgress: number;
  completed: number;
};

export function StudentCoursesStats({ total, inProgress, completed }: Props) {
  const items = [
    { label: 'Enrolled', value: total },
    { label: 'In progress', value: inProgress },
    { label: 'Completed', value: completed },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-center shadow-sm"
        >
          <p className="text-2xl font-bold tabular-nums text-slate-900">{item.value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
