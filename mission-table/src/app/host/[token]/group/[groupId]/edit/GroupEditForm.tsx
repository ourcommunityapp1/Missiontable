'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HostGroup } from '@/lib/queries';
import { updateGroup } from './actions';

const TIMEZONES = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
  { label: 'Atlantic Time (AT)', value: 'America/Halifax' },
  { label: 'UTC', value: 'UTC' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin (CET)', value: 'Europe/Paris' },
  { label: 'Madrid (CET)', value: 'Europe/Madrid' },
  { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'Seoul / Tokyo (KST/JST)', value: 'Asia/Seoul' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Mexico City (CST)', value: 'America/Mexico_City' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
];

const labelClass = 'block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1';
const inputClass = 'w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none focus:border-black';

export default function GroupEditForm({ group, token }: { group: HostGroup; token: string }) {
  const router = useRouter();
  const [rhythmType, setRhythmType] = useState(group.rhythm_type);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    formData.set('rhythm_type', rhythmType);
    const result = await updateGroup(group.id, formData);
    if ('error' in result) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('saved');
      setTimeout(() => {
        router.push(`/host/${token}`);
      }, 800);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Group name */}
      <div>
        <label className={labelClass}>Group Name</label>
        <input
          name="name"
          type="text"
          defaultValue={group.name ?? ''}
          className={inputClass}
          placeholder="e.g. The Hernandez Table"
        />
      </div>

      {/* City / State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input name="city" type="text" defaultValue={group.city ?? ''} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>State / Province</label>
          <input name="state" type="text" defaultValue={group.state ?? ''} className={inputClass} />
        </div>
      </div>

      {/* Rhythm */}
      <div>
        <label className={labelClass}>Meeting Rhythm</label>
        <div className="flex gap-4 mb-3">
          {[
            { label: 'Same day each month (e.g. the 15th)', value: 'date_of_month' },
            { label: 'Same weekday each month (e.g. 3rd Sunday)', value: 'day_of_week_pattern' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-start gap-2 cursor-pointer flex-1">
              <input
                type="radio"
                name="rhythm_type"
                value={opt.value}
                checked={rhythmType === opt.value}
                onChange={() => setRhythmType(opt.value)}
                className="mt-0.5 flex-shrink-0"
              />
              <span className="font-inter text-sm text-warm">{opt.label}</span>
            </label>
          ))}
        </div>

        {rhythmType === 'date_of_month' && (
          <div>
            <label className={labelClass}>Day of Month</label>
            <input
              name="day_of_month"
              type="number"
              min={1}
              max={28}
              defaultValue={group.day_of_month ?? ''}
              className={`${inputClass} w-24`}
            />
          </div>
        )}

        {rhythmType === 'day_of_week_pattern' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Week of Month</label>
              <select name="week_of_month" defaultValue={group.week_of_month ?? ''} className={inputClass}>
                <option value="" disabled>—</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Day of Week</label>
              <select name="day_of_week" defaultValue={group.day_of_week ?? ''} className={inputClass}>
                <option value="" disabled>—</option>
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Meeting time + timezone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Meeting Time</label>
          <input
            name="meeting_time"
            type="time"
            defaultValue={group.meeting_time}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Timezone</label>
          <select name="timezone" defaultValue={group.timezone} required className={inputClass}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Start date + Max size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            name="start_date"
            type="date"
            defaultValue={group.start_date}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Max Group Size <span className="normal-case font-normal">(optional)</span></label>
          <input
            name="max_size"
            type="number"
            min={1}
            defaultValue={group.max_size ?? ''}
            className={inputClass}
            placeholder="No limit"
          />
        </div>
      </div>

      {errorMsg && <p className="font-inter text-sm text-red-600">{errorMsg}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === 'saving' || status === 'saved'}
          className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase py-3 px-6 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save Changes'}
        </button>
        <a
          href={`/host/${token}`}
          className="font-inter font-semibold text-sm tracking-[0.05em] uppercase py-3 px-6 border-2 border-black hover:bg-black hover:text-white transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
