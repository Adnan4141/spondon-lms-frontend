export function UsersAccessDenied() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        User Management is restricted to Super Admin.
      </div>
    </main>
  );
}
