'use client';

import { useEffect, useState } from 'react';
import { Users, UserRound, CalendarDays, BedDouble, Receipt, TrendingUp } from 'lucide-react';
import { patientsApi, doctorsApi, appointmentsApi, billingApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatCard, StatusBadge, PageLoader } from '@/components/ui';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      patientsApi.list(0, 200),
      doctorsApi.list(0, 200),
      appointmentsApi.list(0, 200),
      billingApi.listBills(0, 200),
      billingApi.listRooms(0, 200),
      billingApi.listAdmissions(0, 200),
    ]).then(([patients, doctors, appointments, bills, rooms, admissions]) => {
      setData({
        patients:    patients.status === 'fulfilled' ? patients.value : [],
        doctors:     doctors.status === 'fulfilled' ? doctors.value : [],
        appointments: appointments.status === 'fulfilled' ? appointments.value : [],
        bills:       bills.status === 'fulfilled' ? bills.value : [],
        rooms:       rooms.status === 'fulfilled' ? rooms.value : [],
        admissions:  admissions.status === 'fulfilled' ? admissions.value : [],
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const { patients, doctors, appointments, bills, rooms, admissions } = data;
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a: any) => a.appointment_date === today);
  const pendingBills = bills.filter((b: any) => b.status === 'Pending');
  const totalRevenue = bills.filter((b: any) => b.status === 'Paid').reduce((s: number, b: any) => s + b.total_amount, 0);
  const availableRooms = rooms.filter((r: any) => r.status === 'Available').length;
  const recentAppointments = [...appointments].sort((a: any, b: any) =>
    new Date(b.created_at ?? b.appointment_date).getTime() - new Date(a.created_at ?? a.appointment_date).getTime()
  ).slice(0, 6);
  const activeAdmissions = admissions.filter((a: any) => a.status === 'Active').slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Patients" value={patients.length} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard label="Doctors" value={doctors.length} icon={<UserRound className="w-5 h-5" />} color="purple"
          sub={`${doctors.filter((d: any) => d.is_available).length} available`} />
        <StatCard label="Today's Appts" value={todayAppts.length} icon={<CalendarDays className="w-5 h-5" />} color="green" />
        <StatCard label="Available Rooms" value={availableRooms} icon={<BedDouble className="w-5 h-5" />} color="amber"
          sub={`of ${rooms.length} total`} />
        <StatCard label="Pending Bills" value={pendingBills.length} icon={<Receipt className="w-5 h-5" />} color="red" />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon={<TrendingUp className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Appointments */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Appointments</h2>
            <Link href="/appointments" className="text-xs text-brand-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No appointments yet</p>
            ) : recentAppointments.map((a: any) => (
              <div key={a.appointment_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `Patient #${a.patient_id}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(a.appointment_date)} · {a.appointment_time?.slice(0, 5)}
                    {a.doctor ? ` · Dr. ${a.doctor.last_name}` : ''}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Active Admissions */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Active Admissions</h2>
            <Link href="/rooms" className="text-xs text-brand-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {activeAdmissions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No active admissions</p>
            ) : activeAdmissions.map((a: any) => (
              <div key={a.admission_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `Patient #${a.patient_id}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.diagnosis} · Room {a.room?.room_number ?? a.room_id}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card px-5 py-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '+ New Patient',      href: '/patients' },
            { label: '+ Book Appointment', href: '/appointments' },
            { label: '+ Admit Patient',    href: '/rooms' },
            { label: '+ Create Bill',      href: '/billing' },
            { label: '+ Medical Record',   href: '/medical-records' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="btn-secondary text-xs py-1.5">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
