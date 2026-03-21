'use client';

import { useState, useEffect } from 'react';
import { Modal, Field, Spinner, ErrorBanner } from '@/components/ui';
import { doctorsApi } from '@/lib/api';
import { Doctor, DoctorCreate } from '@/types';

const EMPTY: DoctorCreate = {
  first_name: '', last_name: '', specialization: '', license_number: '', is_available: true,
};

export default function DoctorModal({ open, onClose, doctor, onSaved }: {
  open: boolean; onClose: () => void; doctor: Doctor | null; onSaved: () => void;
}) {
  const [form, setForm] = useState<DoctorCreate>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctor) {
      const { doctor_id, created_at, ...rest } = doctor as any;
      setForm(rest);
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [doctor, open]);

  const set = (k: keyof DoctorCreate, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.specialization || !form.license_number) {
      setError('All required fields must be filled.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (doctor) {
        await doctorsApi.update(doctor.doctor_id, form);
      } else {
        await doctorsApi.create(form);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={doctor ? 'Edit Doctor' : 'Add Doctor'} size="md">
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required>
          <input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
        </Field>
        <Field label="Last Name" required>
          <input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
        </Field>
        <Field label="Specialization" required>
          <input className="input" value={form.specialization} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Cardiology" />
        </Field>
        <Field label="License Number" required>
          <input className="input" value={form.license_number} onChange={e => set('license_number', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="input" value={form.phone ?? ''} onChange={e => set('phone', e.target.value || undefined)} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email ?? ''} onChange={e => set('email', e.target.value || undefined)} />
        </Field>
        <div className="col-span-2 flex items-center gap-2.5">
          <input
            type="checkbox" id="available" checked={form.is_available ?? true}
            onChange={e => set('is_available', e.target.checked)}
            className="w-4 h-4 accent-brand-600 cursor-pointer"
          />
          <label htmlFor="available" className="text-sm text-slate-700 cursor-pointer">Currently available for appointments</label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <Spinner size="sm" />}
          {doctor ? 'Save Changes' : 'Add Doctor'}
        </button>
      </div>
    </Modal>
  );
}
