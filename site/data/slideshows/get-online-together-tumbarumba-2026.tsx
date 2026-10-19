import type { SlideData, SlideshowMeta } from '@/types/slideshows.ts';
import QRCode from '@/components/QRCode.tsx';

const eventUrl = 'https://futuretogether.community/events/get-online-together-digital-skills-for-tumbarumba-2026-10-23';
const beConnectedUrl = 'https://beconnected.esafety.gov.au/';
const surveyUrl = 'https://my.goodthingsaustralia.org/s/gow-event-survey';
const talkToAiUrl = 'https://goodthingsaustralia.org/learn-resource/how-to-talk-to-ai/';
const spottingScamsUrl = 'https://goodthingsaustralia.org/learn-resource/spotting-text-scams/';
const connectedHomeUrl = 'https://goodthingsaustralia.org/learn-resource/getting-connected-at-home/';
const strongPasswordsUrl = 'https://goodthingsaustralia.org/learn-resource/how-to-make-strong-passwords/';
const deviceEasierUrl = 'https://goodthingsaustralia.org/learn-resource/make-your-device-easier-to-use-2/';
const aiEverydayQuizUrl = 'https://goodthingsaustralia.org/learn-resource/ai-in-your-everyday-life-quiz/';
const whatIsAiQuizUrl = 'https://goodthingsaustralia.org/learn-resource/what-is-ai-quiz/';

export const slides: SlideData[] = [
	{
		id: 1,
		title: 'Welcome',
		content: (
			<>
				<div class='slide-logo'>
					<img src='/logo.svg' alt='Future Together' />
				</div>
				<h1>Get Online Together</h1>
				<div class='subtitle'>Digital skills for Tumbarumba &middot; Get Online Week 2026</div>
				<div class='info-box' style='max-width:900px;width:100%;text-align:center;'>
					<p style='font-size:1.25rem;color:#374151;line-height:1.65;'>
						<strong>Presented by Charlie Garrison, Future Together</strong>
						<br />
						In partnership with Good Things Australia and Be Connected
					</p>
				</div>
				<p style='font-size:1.1rem;color:#6b7280;text-align:center;margin-top:0.5rem;'>
					Friday 23 October 2026 &middot; 10:30am&ndash;12:00pm &middot; Tumbarumba Public Library
				</p>
			</>
		),
		notes: {
			pace: 'Welcome &middot; ~3 min',
			cumulative: 3,
			anchor: 'Warm welcome, set expectations, thank partners.',
			bullets: [
				{ type: 'say', text: 'Good morning, and welcome to Get Online Together — thank you for coming along today.' },
				{
					type: 'say',
					text: 'I am Charlie from Future Together, and today is part of Get Online Week, a national campaign run by Good Things Australia.',
				},
				{ type: 'say', text: 'This session is free and friendly, and there is no such thing as a silly question today.' },
				{ type: 'cue', text: 'Point out toilets, exits, morning tea, and the quiet/help area.' },
			],
		},
	},
	{
		id: 2,
		title: 'How today works',
		content: (
			<>
				<h2>How today works</h2>
				<div class='large-text'>We are doing things a little differently today — your questions are the main event.</div>
				<div class='emphasis-box' style='max-width:1000px;width:100%;'>
					<h3>&#9999;&#65039; Please grab some paper and a pen</h3>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>
						As we watch short videos and play a quiz together, write down any question that comes to mind — big or small.
						There is no such thing as a silly question.
					</p>
				</div>
				<div class='info-box' style='max-width:1000px;width:100%;'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>
						After the videos, we will group similar questions together and spend our hands-on time answering exactly what you
						want to know.
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Instructions &middot; ~2 min',
			cumulative: 5,
			anchor: 'Explain the paper-and-pen / question-writing format clearly before starting.',
			bullets: [
				{
					type: 'say',
					text: "We are going to watch five short videos and play a quiz together from Good Things Australia, the people behind Get Online Week.",
				},
				{
					type: 'say',
					text: 'While we watch, please jot down any question that comes up for you — it does not need to be about what is on screen.',
				},
				{
					type: 'say',
					text: "After that, we will group similar questions together, so if several of you are curious about AI, or about scams, you will get hands-on time with others asking the same thing.",
				},
				{
					type: 'say',
					text: "If nothing comes to mind, that is fine too — we also have three stations ready to go: Be Connected, staying safe online, and emergency information.",
				},
				{ type: 'cue', text: 'Have helpers hand out paper and pens now if anyone needs them.' },
			],
		},
	},
	{
		id: 3,
		title: 'Be Connected',
		content: (
			<>
				<h2>Your home base: Be Connected</h2>
				<div class='large-text'>
					Be Connected is a free, government-backed library of courses for everyday digital skills — videos, quizzes and
					tip sheets you can return to any time.
				</div>
				<div class='info-box' style='max-width:900px;width:100%;text-align:center;'>
					<QRCode url={beConnectedUrl} style='width:150px;height:150px;margin:0.75rem auto;' />
					<p style='font-size:1rem;font-weight:700;color:#1a5f6e;'>beconnected.esafety.gov.au</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>
					Everything we try today connects back here — at your own pace, whenever you like.
				</p>
			</>
		),
		notes: {
			pace: 'Be Connected intro &middot; ~3 min',
			cumulative: 8,
			anchor: 'Introduce Be Connected as the ongoing resource; encourage scanning/visiting (grant requirement).',
			bullets: [
				{
					type: 'say',
					text: "Be Connected is run by the Australian Government's eSafety Commissioner — it is completely free, and there is no catch.",
				},
				{ type: 'say', text: 'You can browse hundreds of short courses: video calls, photos, online shopping, safety and more.' },
				{
					type: 'say',
					text: "Scan the QR code if you would like, or we will remind you again at the end — today's content is really a taste of what is there.",
				},
				{ type: 'cue', text: 'Offer help scanning for anyone unfamiliar with QR codes; a helper can hold a phone steady if needed.' },
			],
		},
	},
	{
		id: 4,
		title: 'Video: How to Talk to AI',
		content: (
			<>
				<div class='subtitle'>Video &middot; Good Things Australia</div>
				<h2>How to Talk to AI</h2>
				<div class='large-text'>AI chatbots can help with everyday writing and questions — if you know how to ask.</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>&#128221; Write down any question this raises for you.</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>Thanks to the National AI Centre for this resource.</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/how-to-talk-to-ai</span>
				</div>
			</>
		),
		notes: {
			pace: 'Video 1 &middot; ~3 min',
			cumulative: 11,
			anchor: 'Switch to the pre-opened tab and play the video full-screen with captions on.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: How to Talk to AI. Play full-screen, captions on.' },
				{
					type: 'say',
					text: 'This video shows how asking an AI chatbot a question is a bit like giving someone directions — the clearer you are, the better the answer.',
				},
				{ type: 'say', text: 'A printed tip sheet for this one is available today if you would like to take it home.' },
				{ type: 'cue', text: 'Return to the slideshow tab after the video ends.' },
			],
		},
	},
	{
		id: 5,
		title: 'Video: Spotting Text Scams',
		content: (
			<>
				<div class='subtitle'>Video &middot; Good Things Australia</div>
				<h2>Spotting Text Scams</h2>
				<div class='large-text'>Scammers try to rush you and trick you into reacting — here is what to watch for.</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>&#128221; Write down any question this raises for you.</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>Thanks to Be Connected for this resource.</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/spotting-text-scams</span>
				</div>
			</>
		),
		notes: {
			pace: 'Video 2 &middot; ~3 min',
			cumulative: 14,
			anchor: 'Switch to the pre-opened tab and play the video full-screen with captions on.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: Spotting Text Scams. Play full-screen, captions on.' },
				{
					type: 'say',
					text: 'Two signs to remember: scammers tell you to act fast, and scammers use tricks to get a reaction.',
				},
				{
					type: 'say',
					text: "There is also a new rule: if a text message is marked 'Unverified' at the top, it could be a scammer pretending to be a business.",
				},
				{ type: 'cue', text: 'Return to the slideshow tab after the video ends.' },
			],
		},
	},
	{
		id: 6,
		title: 'Video: Getting Connected at Home',
		content: (
			<>
				<div class='subtitle'>Video &middot; Good Things Australia</div>
				<h2>Getting Connected at Home</h2>
				<div class='large-text'>Choosing the right internet plan comes down to how you actually use the internet.</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>&#128221; Write down any question this raises for you.</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>Thanks to nbn for this resource.</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/getting-connected-at-home</span>
				</div>
			</>
		),
		notes: {
			pace: 'Video 3 &middot; ~3 min',
			cumulative: 17,
			anchor: 'Switch to the pre-opened tab and play the video full-screen with captions on.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: Getting Connected at Home. Play full-screen, captions on.' },
				{
					type: 'say',
					text: 'Lower-speed plans suit social media and online shopping; higher-speed plans suit video calls and streaming.',
				},
				{ type: 'say', text: 'Some providers offer discounts for seniors, pensioners and concession card holders — it is worth asking.' },
				{ type: 'cue', text: 'Return to the slideshow tab after the video ends.' },
			],
		},
	},
	{
		id: 7,
		title: 'Video: How to Make Strong Passwords',
		content: (
			<>
				<div class='subtitle'>Video &middot; Good Things Australia</div>
				<h2>How to Make Strong Passwords</h2>
				<div class='large-text'>A strong password is like a lock that cannot be broken into — here is how to build one.</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>&#128221; Write down any question this raises for you.</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>
					Thanks to Aussie Broadband for this resource. There is also a quiz version you can try one-on-one in our hands-on
					time.
				</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/how-to-make-strong-passwords</span>
				</div>
			</>
		),
		notes: {
			pace: 'Video 4 &middot; ~3 min',
			cumulative: 20,
			anchor: 'Play the video only here — the quiz is reserved for hands-on/self-paced time.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: How to Make Strong Passwords (video section only). Captions on.' },
				{
					type: 'say',
					text: 'Three tips: make it creative (15+ characters, combine words that mean something to you), make it harder to guess with numbers/symbols, and make it unique for every account.',
				},
				{
					type: 'say',
					text: 'This one also has an interactive quiz comparing strong and weak passwords — that is a great one to try solo or in pairs during hands-on time.',
				},
				{ type: 'cue', text: 'Return to the slideshow tab after the video ends.' },
			],
		},
	},
	{
		id: 8,
		title: 'Video: Make Your Device Easier to Use',
		content: (
			<>
				<div class='subtitle'>Video &middot; Good Things Australia</div>
				<h2>Make Your Device Easier to Use</h2>
				<div class='large-text'>Small accessibility settings can make a big difference — most are already on your device, free.</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>&#128221; Write down any question this raises for you.</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>Thanks to auDA for this resource.</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/make-your-device-easier-to-use</span>
				</div>
			</>
		),
		notes: {
			pace: 'Video 5 &middot; ~3 min',
			cumulative: 23,
			anchor: 'Switch to the pre-opened tab and play the video full-screen with captions on.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: Make Your Device Easier to Use. Play full-screen, captions on.' },
				{
					type: 'say',
					text: 'Check the accessibility settings (usually a cog/wheel icon) for text size, dark mode, captions, and text-to-voice.',
				},
				{ type: 'say', text: 'Virtual assistants like a voice helper can send messages and set alarms without pressing buttons.' },
				{ type: 'cue', text: 'Return to the slideshow tab after the video ends.' },
			],
		},
	},
	{
		id: 9,
		title: "Group quiz: AI in Your Everyday Life",
		content: (
			<>
				<div class='subtitle'>Quiz &middot; played together &middot; Good Things Australia</div>
				<h2>AI in Your Everyday Life</h2>
				<div class='large-text'>True or false — is this everyday task already using AI? Call out your answer!</div>
				<div class='emphasis-box'>
					<p style='font-size:1.1rem;color:#374151;text-align:center;'>
						We play this one as a whole room — shout True or False together, then keep writing down your own questions.
					</p>
				</div>
				<p style='font-size:1rem;color:#6b7280;text-align:center;'>Thanks to the National AI Centre for this resource.</p>
				<div class='slide-footnotes'>
					<span>goodthingsaustralia.org/learn-resource/ai-in-your-everyday-life-quiz</span>
				</div>
			</>
		),
		notes: {
			pace: 'Group quiz &middot; ~7 min',
			cumulative: 30,
			anchor: 'Play the full quiz together as a group activity — read each statement aloud, let the room call out answers.',
			bullets: [
				{ type: 'cue', text: 'Switch to pre-opened browser tab: AI in Your Everyday Life quiz. Full-screen.' },
				{ type: 'say', text: 'I will read each statement, and you call out together: true or false!' },
				{ type: 'say', text: 'There are about ten of these — have a laugh, there is no wrong answer until after you guess.' },
				{ type: 'say', text: 'Keep writing down anything you are curious about as we go.' },
				{ type: 'cue', text: 'Return to the slideshow tab once the quiz is finished.' },
			],
		},
	},
	{
		id: 10,
		title: 'Handover: Emergency Alerts',
		content: (
			<>
				<h2>Now, something close to home: emergency information</h2>
				<div class='large-text'>
					None of today's Good Things Australia resources cover emergency alerts — because this part is about Tumbarumba
					specifically.
				</div>
				<div class='info-box' style='max-width:950px;width:100%;text-align:center;'>
					<p style='font-size:1.2rem;color:#374151;'>
						Please welcome <strong>Peter Makryllos</strong> from Australian Red Cross RediCommunities.
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Handover &middot; ~2 min',
			cumulative: 32,
			anchor: 'Hand over clearly to Peter; acknowledge recent local bushfire experience with care, not alarm.',
			bullets: [
				{
					type: 'say',
					text: 'This community knows better than most how much emergency information matters — many of us lived through the recent bushfires.',
				},
				{
					type: 'say',
					text: 'Peter works with Australian Red Cross RediCommunities, and he is going to share practical, local information on staying informed.',
				},
				{
					type: 'cue',
					text: 'Hand the floor to Peter. This segment is his — Future Together is not the subject-matter expert here.',
				},
			],
		},
	},
	{
		id: 11,
		title: "Emergency alerts (Peter's segment)",
		content: (
			<>
				<h2>Emergency alerts &amp; local information</h2>
				<div class='large-text'>Know where to find reliable warnings, updates and emergency information — before you need them.</div>
				<div class='info-box' style='max-width:950px;width:100%;text-align:center;'>
					<p style='font-size:1.1rem;color:#374151;'>
						(Content and pace led by Peter Makryllos — this slide stays up as a visual reference.)
					</p>
				</div>
				<div class='warning-box' style='max-width:950px;width:100%;text-align:center;'>
					<p style='font-size:1.15rem;color:#374151;'>For immediate danger, always call <strong>000</strong>.</p>
				</div>
				<div class='slide-footnotes'>
					<span>Australian Red Cross RediCommunities &mdash; redcross.org.au/emergencies/prepare/</span>
				</div>
			</>
		),
		notes: {
			pace: "Peter's segment &middot; ~8 min",
			cumulative: 40,
			anchor: "This slide is a backdrop for Peter's live content; keep it simple and get out of the way.",
			bullets: [
				{
					type: 'cue',
					text: 'This slide intentionally stays simple — Peter will speak to his own material/handouts. Do not advance until Peter indicates he is finished.',
				},
				{ type: 'say', text: '(If needed) Thank you, Peter — are there any quick questions before we move into our hands-on time?' },
				{ type: 'note', text: 'Keep a demo phone/device ready in case Peter wants to show an app or website live.' },
			],
		},
	},
	{
		id: 12,
		title: 'From questions to hands-on',
		content: (
			<>
				<h2>Now: your questions</h2>
				<div class='large-text'>Look at what you have written down. We are going to group similar questions together.</div>
				<div class='question'>What came up for you?</div>
			</>
		),
		notes: {
			pace: 'Transition &middot; ~3 min',
			cumulative: 43,
			anchor: "Collect a sense of the room's questions out loud before splitting into groups.",
			bullets: [
				{
					type: 'say',
					text: "Take a moment to look over what you've written. Does anyone want to call out a question they'd like answered?",
				},
				{
					type: 'say',
					text: "As people share, I'll listen for common themes — AI questions, scam questions, password questions, connectivity questions, and so on.",
				},
				{
					type: 'cue',
					text: "Write emerging themes on a whiteboard/flipchart if available, or group people verbally by raised hands ('who else wrote something about AI?').",
				},
				{
					type: 'say',
					text: 'If your question does not fit a group, or you would simply like to explore on your own, our three stations are still open: Be Connected, staying safe online, and emergency information.',
				},
			],
		},
	},
	{
		id: 13,
		title: 'Hands-on time',
		content: (
			<>
				<h2>Hands-on time</h2>
				<div class='large-text'>Join the group that matches your question, or visit a station — whatever is most useful for you.</div>
				<div style='display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:1050px;width:100%;margin-top:1rem;'>
					<div class='info-box' style='margin:0;'>
						<h3>Question groups (today's example)</h3>
						<ul>
							<li>&#129302; AI questions</li>
							<li>&#128737;&#65039; Scam-watch</li>
							<li>&#128272; Passwords &amp; accounts</li>
							<li>&#128246; Getting connected</li>
							<li>&hellip;however many groups suit the room</li>
						</ul>
					</div>
					<div class='emphasis-box' style='margin:0;'>
						<h3>Fallback stations</h3>
						<ul>
							<li>Be Connected</li>
							<li>Staying safe online</li>
							<li>Emergency information</li>
						</ul>
					</div>
				</div>
				<div class='info-box' style='max-width:1050px;width:100%;margin-top:1rem;'>
					<p style='font-size:1rem;color:#374151;text-align:center;'>
						Want to try something solo? The Strong Passwords quiz and the What is AI? quiz are great to explore at your own
						pace — ask a helper for the link.
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Hands-on &middot; ~20-25 min',
			cumulative: 68,
			anchor: "Facilitate organically — this is the bulk of the session's value. Group size is organic; could remain one group.",
			bullets: [
				{ type: 'say', text: 'Spread out, find your group or station, and dive in. Helpers and I will circulate.' },
				{ type: 'say', text: 'It is fine if everyone ends up in one big group — we will just move through topics together.' },
				{
					type: 'cue',
					text: '\u{1F4F8} IMPORTANT — grant acquittal requires a photo showing attendees at the event (backs of heads/backs of people are fine for privacy). Take it now while everyone is engaged — do not leave this until the end.',
				},
				{
					type: 'cue',
					text: 'Remind anyone creating a Be Connected account that it is optional, and they enter their own details.',
				},
				{ type: 'note', text: 'Do not ask for or view anyone\'s password, MFA code, bank details, or ID documents.' },
				{
					type: 'note',
					text: 'Solo/self-paced device links for this segment: Strong Passwords quiz, What is AI? quiz (1-2 sections is plenty).',
				},
			],
		},
	},
	{
		id: 14,
		title: 'Regroup &amp; Q&amp;A',
		content: (
			<>
				<h2>Let's come back together</h2>
				<div class='large-text'>What is one thing that felt useful today? What is one question you still have?</div>
			</>
		),
		notes: {
			pace: 'Regroup &amp; Q&amp;A &middot; ~12 min',
			cumulative: 80,
			anchor: 'Bring the room back together, harvest final questions, keep tone warm.',
			bullets: [
				{ type: 'say', text: 'What is one thing that felt useful today, or one question you are still turning over?' },
				{
					type: 'say',
					text: 'If a question needs specialist advice, let us point to a trusted official source rather than guessing.',
				},
				{
					type: 'cue',
					text: 'If time is short, prioritise closing warmly over covering every remaining question — offer to follow up after.',
				},
			],
		},
	},
	{
		id: 15,
		title: 'Survey',
		content: (
			<>
				<h2>Help us keep running sessions like this</h2>
				<div class='large-text'>
					Your feedback — and completing this short survey — helps secure funding for future Get Online Week events.
				</div>
				<div class='info-box' style='max-width:900px;width:100%;text-align:center;'>
					<QRCode url={surveyUrl} style='width:160px;height:160px;margin:0.75rem auto;' />
					<p style='font-weight:700;color:#1a5f6e;'>4 quick questions &middot; fully anonymous</p>
				</div>
				<p style='text-align:center;color:#6b7280;'>Paper copies and assisted completion are available too — just ask.</p>
			</>
		),
		notes: {
			pace: 'Survey &middot; ~5 min',
			cumulative: 85,
			anchor: 'Explicitly ask for survey completion — grant target is 10+ responses.',
			bullets: [
				{
					type: 'say',
					text: 'This survey takes about a minute, and every response genuinely helps us keep running free sessions like this one.',
				},
				{ type: 'say', text: 'It is anonymous, and a helper can read it aloud for you if that is easier.' },
				{
					type: 'cue',
					text: 'Target: at least 10 completed surveys today — offer paper + assisted options; do not photograph completed surveys.',
				},
			],
		},
	},
	{
		id: 16,
		title: 'Prize draw',
		content: (
			<>
				<h2>Prize draw</h2>
				<div class='large-text'>Thank you for being here today — let's draw a prize!</div>
				<div class='info-box' style='max-width:900px;width:100%;text-align:center;'>
					<p style='font-size:1.05rem;color:#374151;'>
						No purchase necessary. One entry per person. See your participant information sheet for full terms.
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Prize draw &middot; ~5 min',
			cumulative: 90,
			anchor: 'Light, celebratory close to the formal session.',
			bullets: [
				{ type: 'say', text: 'There is no purchase necessary to enter, just a voluntary prize slip.' },
				{
					type: 'cue',
					text: 'Draw fairly with a second staff member observing; record only the minimum needed winner/contact detail.',
				},
				{
					type: 'cue',
					text: '\u{1F4F8} LAST CHANCE — if the grant acquittal attendee photo has not been taken yet, take it now before people start leaving.',
				},
			],
		},
	},
	{
		id: 17,
		title: 'Closing',
		content: (
			<>
				<h2>Thank you for giving this a try</h2>
				<div class='large-text'>Digital confidence is built one small step at a time.</div>
				<div class='info-box' style='max-width:900px;width:100%;text-align:center;'>
					<QRCode url={eventUrl} style='width:140px;height:140px;margin:0.6rem auto;' />
					<p style='font-weight:700;color:#c4853a;'>futuretogether.community/meetups</p>
				</div>
				<p style='text-align:center;color:#6b7280;'>Hands-on help continues informally over lunch — stay as long as you like.</p>
				<div class='subtitle' style='margin-top:0.75rem;font-style:italic;'>
					"The future is arriving. Let's face it together."
				</div>
				<p style='font-size:0.75rem;color:#9ca3af;text-align:center;margin-top:1rem;'>Future Together &middot; built with BB</p>
			</>
		),
		notes: {
			pace: 'Closing &middot; ~2 min',
			cumulative: 90,
			anchor: 'Warm close; mention informal lunch hands-on help continues.',
			bullets: [
				{
					type: 'say',
					text: 'Thank you for giving this a try — keep your handout, return to a Be Connected topic when you are ready, and remember: pause, check and ask when something online does not feel right.',
				},
				{ type: 'say', text: 'Thank you to everyone who helped make today possible, including Good Things Australia and Australian Red Cross.' },
				{ type: 'cue', text: 'Mention informal hands-on help continues over lunch for anyone who wants to stay.' },
			],
		},
	},
];

export const meta: SlideshowMeta = {
	slug: 'get-online-together-tumbarumba-2026',
	title: 'Get Online Together: Digital Skills for Tumbarumba',
	eventSlug: 'get-online-together-digital-skills-for-tumbarumba-2026-10-23',
	slideCount: 17,
	durationMinutes: 90,
	description:
		'Get Online Week 2026 session for Tumbarumba: Good Things Australia videos and quizzes feed attendee questions into an organic hands-on help segment (AI, scam-watch and more), with Be Connected, Australian Red Cross RediCommunities emergency information, and the Get Online Week survey.',
};

export const loadSlides = () => Promise.resolve(slides);
