'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startGroup } from './actions';

const COUNTRIES = [
  { name: 'Bangladesh', slug: 'bangladesh' },
  { name: 'China', slug: 'china' },
  { name: 'Germany', slug: 'germany' },
  { name: 'Guatemala', slug: 'guatemala' },
  { name: 'Honduras', slug: 'honduras' },
  { name: 'India', slug: 'india' },
  { name: 'Indonesia', slug: 'indonesia' },
  { name: 'Kosovo', slug: 'kosovo' },
  { name: 'North Korea', slug: 'north-korea' },
  { name: 'Pakistan', slug: 'pakistan' },
  { name: 'Spain', slug: 'spain' },
  { name: 'United Kingdom', slug: 'united-kingdom' },
];

const TIMEZONES = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
  { label: 'Atlantic Time (AT)', value: 'America/Halifax' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin (CET)', value: 'Europe/Paris' },
  { label: 'Madrid (CET)', value: 'Europe/Madrid' },
  { label: 'Athens (EET)', value: 'Europe/Athens' },
  { label: 'Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'Bangladesh (BST)', value: 'Asia/Dhaka' },
  { label: 'Bangkok (ICT)', value: 'Asia/Bangkok' },
  { label: 'Jakarta (WIB)', value: 'Asia/Jakarta' },
  { label: 'Singapore / Beijing (SGT)', value: 'Asia/Singapore' },
  { label: 'Seoul (KST)', value: 'Asia/Seoul' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEDT)', value: 'Australia/Sydney' },
  { label: 'Auckland (NZDT)', value: 'Pacific/Auckland' },
  { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
  { label: 'Cairo (EET)', value: 'Africa/Cairo' },
  { label: 'Mexico City (CST)', value: 'America/Mexico_City' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
];

const inputClass =
  'w-full border-2 border-black bg-cream px-3 py-3 font-inter text-sm text-black placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-black';

const labelClass =
  'block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2';

const selectClass =
  'w-full border-2 border-black bg-cream px-3 py-3 font-inter text-sm text-black focus:outline-none focus:ring-2 focus:ring-black appearance-none';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-black pt-6 mb-6">
      <h2 className="font-fraunces font-bold text-[28px] leading-tight fraunces-32 text-black uppercase">
        {children}
      </h2>
    </div>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-start gap-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span
            className={`mt-0.5 w-5 h-5 border-2 border-black flex-none flex items-center justify-center transition-colors ${
              value === opt.value ? 'bg-black' : 'bg-cream'
            }`}
          >
            {value === opt.value && (
              <span className="font-inter font-bold text-[11px] leading-none text-white select-none">
                ✕
              </span>
            )}
          </span>
          <span className="font-inter text-sm text-black leading-snug">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-inter text-xs text-muted">
        ▾
      </span>
    </div>
  );
}

export default function StartGroupForm({ defaultCountry }: { defaultCountry?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCountry, setSuccessCountry] = useState<string | null>(null);

  const [hostType, setHostType] = useState('individual');
  const [groupType, setGroupType] = useState('virtual');
  const [rhythmType, setRhythmType] = useState('day_of_week_pattern');

  const isInPerson = groupType === 'in-person';
  const isDateOfMonth = rhythmType === 'date_of_month';
  const isDayOfWeekPattern = rhythmType === 'day_of_week_pattern';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set('host_type', hostType);
    formData.set('group_type', groupType);
    formData.set('rhythm_type', rhythmType);

    const result = await startGroup(formData);
    setPending(false);

    if (result.success) {
      setSuccessCountry(result.countrySlug);
    } else {
      setError(result.error);
    }
  }

  if (successCountry) {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">
        <div className="max-w-[640px]">
          <div className="border-2 border-black p-8 md:p-12">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-4">
              Group Registered
            </p>
            <h2 className="font-fraunces font-bold text-[40px] md:text-[48px] uppercase leading-none tracking-[-0.03em] fraunces-64 text-black mb-6">
              You&apos;re On the Map
            </h2>
            <p className="font-inter text-base text-warm mb-8">
              Your request has been received. A Mission Table admin will review and approve your group — once approved, it will appear on the country page you signed up for.
            </p>
            <Link
              href={`/country/${successCountry}`}
              className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
            >
              View Your Country Page →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">

      {/* Back nav */}
      <div className="mb-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
        >
          <span aria-hidden="true">←</span>
          The Nations
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-3">
          Start a Group
        </p>
        <h1 className="font-fraunces font-bold text-[48px] md:text-[64px] uppercase leading-none tracking-[-0.03em] fraunces-64 text-black">
          Start Your Group
        </h1>
        <p className="font-inter text-base text-warm mt-4 max-w-[560px]">
          Gather monthly and pray for one nation. Fill out the form below and your group will appear on the country page.
        </p>
      </div>

      {/* What Hosts Do */}
      <div className="max-w-[640px] border-2 border-black p-6 mb-10">
        <h2 className="font-fraunces font-bold text-[22px] leading-tight fraunces-32 text-black uppercase mb-4">
          What Hosts Do
        </h2>
        <ul className="flex flex-col gap-3">
          {[
            'Send a recipe from your country to group members each month.',
            'Connect your group to prayer requests from the field — we can help source these if you don\'t already have a connection.',
            'Receive join requests by email and follow up with new members directly (text, WhatsApp, group chat, etc.).',
            'For in-person groups: coordinate all logistics — meeting location, timing, and communication.',
            'Lead ongoing monthly gatherings for the country your group is praying for.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 w-4 h-4 border-2 border-black bg-black flex-none" />
              <span className="font-inter text-sm text-warm leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="max-w-[640px]">

        {/* ── About You ── */}
        <SectionHeading>About You</SectionHeading>

        <div className="flex flex-col gap-5 mb-6">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name <span className="text-accent">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Daniel & Maria R."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-accent">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className={inputClass}
            />
            <p className="font-inter text-xs text-muted mt-1">
              Join requests will be sent to this address.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <p className={labelClass}>
              Host Type <span className="text-accent">*</span>
            </p>
            <RadioGroup
              name="host_type"
              value={hostType}
              onChange={setHostType}
              options={[
                { label: 'Individual or Family', value: 'individual' },
                { label: 'Church', value: 'church' },
                { label: 'Organization', value: 'organization' },
              ]}
            />
          </div>
        </div>

        {/* ── Your Group ── */}
        <SectionHeading>Your Group</SectionHeading>

        <div className="flex flex-col gap-5 mb-6">
          <div>
            <label htmlFor="country_slug" className={labelClass}>
              Country <span className="text-accent">*</span>
            </label>
            <SelectWrapper>
              <select
                id="country_slug"
                name="country_slug"
                required
                defaultValue={defaultCountry ?? ''}
                className={selectClass}
              >
                <option value="" disabled>Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </SelectWrapper>
            <p className="font-inter text-xs text-muted mt-1">
              This is the nation your group will pray for — not where you are located.
            </p>
          </div>

          <div>
            <p className={labelClass}>
              Group Type <span className="text-accent">*</span>
            </p>
            <RadioGroup
              name="group_type"
              value={groupType}
              onChange={setGroupType}
              options={[
                { label: 'In-Person — meets at a specific location', value: 'in-person' },
                { label: 'Virtual — members meet in their own homes', value: 'virtual' },
              ]}
            />
          </div>

          {isInPerson && (
            <>
              <div>
                <label htmlFor="city" className={labelClass}>
                  City <span className="text-accent">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="Austin"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="state" className={labelClass}>State / Region</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="TX"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="max_size" className={labelClass}>Max Group Size</label>
                <input
                  id="max_size"
                  name="max_size"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 8"
                  className={inputClass}
                />
                <p className="font-inter text-xs text-muted mt-1">
                  Leave blank for no limit.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Schedule ── */}
        <SectionHeading>Schedule</SectionHeading>

        <div className="flex flex-col gap-5 mb-6">
          <div>
            <p className={labelClass}>
              Rhythm <span className="text-accent">*</span>
            </p>
            <RadioGroup
              name="rhythm_type"
              value={rhythmType}
              onChange={setRhythmType}
              options={[
                { label: 'Specific date each month (e.g. the 15th)', value: 'date_of_month' },
                { label: 'Same weekday each month (e.g. 3rd Sunday)', value: 'day_of_week_pattern' },
              ]}
            />
          </div>

          {isDateOfMonth && (
            <div>
              <label htmlFor="day_of_month" className={labelClass}>
                Day of Month <span className="text-accent">*</span>
              </label>
              <input
                id="day_of_month"
                name="day_of_month"
                type="number"
                min={1}
                max={28}
                required
                placeholder="e.g. 15"
                className={inputClass}
              />
            </div>
          )}

          {isDayOfWeekPattern && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="week_of_month" className={labelClass}>
                  Week <span className="text-accent">*</span>
                </label>
                <SelectWrapper>
                  <select
                    id="week_of_month"
                    name="week_of_month"
                    required
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="" disabled>—</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </select>
                </SelectWrapper>
              </div>

              <div>
                <label htmlFor="day_of_week" className={labelClass}>
                  Day <span className="text-accent">*</span>
                </label>
                <SelectWrapper>
                  <select
                    id="day_of_week"
                    name="day_of_week"
                    required
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="" disabled>—</option>
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                  </select>
                </SelectWrapper>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="meeting_time" className={labelClass}>
              Meeting Time <span className="text-accent">*</span>
            </label>
            <input
              id="meeting_time"
              name="meeting_time"
              type="time"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="timezone" className={labelClass}>
              Timezone <span className="text-accent">*</span>
            </label>
            <SelectWrapper>
              <select
                id="timezone"
                name="timezone"
                required
                defaultValue=""
                className={selectClass}
              >
                <option value="" disabled>Select a timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>

          <div>
            <label htmlFor="start_date" className={labelClass}>
              Start Date <span className="text-accent">*</span>
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className={inputClass}
            />
            <p className="font-inter text-xs text-muted mt-1">
              When your group begins meeting.
            </p>
          </div>
        </div>

        {/* Commitment note */}
        <div className="border-t-2 border-black pt-6 mb-6">
          <p className="font-inter text-sm text-warm">
            By registering, you&apos;re committing to host ongoing monthly gatherings for the country you selected. Your group will appear on that country&apos;s page immediately.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-2 border-black bg-cream p-4 mb-6">
            <p className="font-inter text-sm text-accent">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Registering...' : 'Register as a Host →'}
        </button>

      </form>
    </div>
  );
}
