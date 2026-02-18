import { useEffect, useState } from 'preact/hooks';

interface EventDateTimeProps {
	date: string; // ISO 8601 date string
	timezone: string; // IANA timezone name (e.g., 'America/New_York')
	showIcon?: boolean;
	iconClass?: string;
	textClass?: string;
}

interface FormattedDateTime {
	date: string;
	time: string;
	timezoneName: string;
	timezoneAbbr: string;
}

function formatDateTime(date: Date, timezone: string, locale: string): FormattedDateTime {
	const dateFormatter = new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: timezone,
	});

	const timeFormatter = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: timezone,
	});

	const timezoneFormatter = new Intl.DateTimeFormat(locale, {
		timeZoneName: 'short',
		timeZone: timezone,
	});

	const parts = timezoneFormatter.formatToParts(date);
	const tzPart = parts.find((part) => part.type === 'timeZoneName');

	return {
		date: dateFormatter.format(date),
		time: timeFormatter.format(date),
		timezoneName: timezone,
		timezoneAbbr: tzPart?.value || '',
	};
}

function areTimezonesEquivalent(
	eventFormatted: FormattedDateTime,
	userFormatted: FormattedDateTime,
): boolean {
	// Check if dates, times, and timezone abbreviations are the same
	return eventFormatted.date === userFormatted.date &&
		eventFormatted.time === userFormatted.time &&
		eventFormatted.timezoneAbbr === userFormatted.timezoneAbbr;
}

export default function EventDateTime(
	{ date, timezone, showIcon = true, iconClass = 'w-5 h-5 mr-1.5 opacity-80', textClass = 'text-lg text-gray-700' }:
		EventDateTimeProps,
) {
	const [mounted, setMounted] = useState(false);
	const [userTimezone, setUserTimezone] = useState<string | null>(null);
	const [userLocale, setUserLocale] = useState<string>('en-US');

	useEffect(() => {
		setMounted(true);
		setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
		// Get user's preferred locale from browser
		const browserLocale = navigator.language || navigator.languages?.[0] || 'en-US';
		setUserLocale(browserLocale);
	}, []);

	// Server-side render or before client hydration - show event timezone only
	if (!mounted || !userTimezone) {
		const eventDate = new Date(date);
		const eventFormatted = formatDateTime(eventDate, timezone, 'en-US');

		return (
			<div class={`flex items-start ${textClass}`}>
				{showIcon && (
					<svg
						class={iconClass}
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							stroke-linecap='round'
							stroke-linejoin='round'
							stroke-width='2'
							d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
						>
						</path>
					</svg>
				)}
				<div>
					<div>
						{eventFormatted.date} • {eventFormatted.time} {eventFormatted.timezoneAbbr}
					</div>
				</div>
			</div>
		);
	}

	// Client-side render - show user timezone with event timezone if different
	const eventDate = new Date(date);
	const eventFormatted = formatDateTime(eventDate, timezone, userLocale);
	const userFormatted = formatDateTime(eventDate, userTimezone, userLocale);

	const showBothTimezones = !areTimezonesEquivalent(eventFormatted, userFormatted);

	if (!showBothTimezones) {
		// Same timezone or equivalent display - show only once
		return (
			<div class={`flex items-start ${textClass}`}>
				{showIcon && (
					<svg
						class={iconClass}
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							stroke-linecap='round'
							stroke-linejoin='round'
							stroke-width='2'
							d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
						>
						</path>
					</svg>
				)}
				<div>
					<div>
						{userFormatted.date} • {userFormatted.time} {userFormatted.timezoneAbbr}
					</div>
				</div>
			</div>
		);
	}

	// Different timezones - show both with user's timezone prominent
	return (
		<div class={`flex items-start ${textClass}`}>
			{showIcon && (
				<svg
					class={iconClass}
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						stroke-linecap='round'
						stroke-linejoin='round'
						stroke-width='2'
						d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
					>
					</path>
				</svg>
			)}
			<div>
				<div class='font-semibold'>
					{userFormatted.date} • {userFormatted.time} {userFormatted.timezoneAbbr}
					<span class='text-sm font-normal text-gray-600 ml-1'>(Your timezone)</span>
				</div>
				<div class='text-sm text-gray-600 mt-1'>
					Event time: {eventFormatted.date} • {eventFormatted.time} {eventFormatted.timezoneAbbr}
				</div>
			</div>
		</div>
	);
}
