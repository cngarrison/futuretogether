import type { SlideData, SlideshowMeta } from '@/types/slideshows.ts';

const eventUrl = 'https://futuretogether.community/events/working-together-to-prepare-for-emergencies-2026-09-15';

export const slides: SlideData[] = [
	{
		id: 1,
		title: 'Welcome',
		content: (
			<>
				<div class='slide-logo'>
					<img src='/logo.svg' alt='Future Together' />
				</div>
				<h1>
					Working Together to
					<br />
					Prepare for Emergencies
				</h1>
				<div class='subtitle'>AI, trusted information and community preparedness</div>
				<div class='info-box' style='max-width:850px;width:100%;text-align:center;'>
					<p style='font-size:1.25rem;color:#374151;line-height:1.65;'>
						<strong>Hosted by Australian Red Cross</strong>
						<br />
						Supported locally by Future Together
						<br />
						Future Together segment presented by local founder Charlie Garrison
					</p>
				</div>
				<p style='font-size:1.1rem;color:#6b7280;text-align:center;margin-top:0.5rem;'>
					Tuesday 15 September 2026 · 5–7 pm · Tumbarumba Bowling Club
				</p>
			</>
		),
		notes: {
			pace: 'Welcome · ~1.5 min',
			cumulative: 1.5,
			anchor: 'Set a practical, respectful tone and distinguish this segment from official advice.',
			bullets: [
				{
					type: 'say',
					text: 'Thank you to Australian Red Cross for hosting this workshop, and thank you all for making time to be here.',
				},
				{ type: 'say', text: 'I am Charlie, a local founder of Future Together.' },
				{
					type: 'say',
					text: 'This is a short, practical segment about trusted information and community preparedness, and it is separate from official emergency advice.',
				},
				{
					type: 'say',
					text: 'We will consider one practical idea and then use your tables to test it against a local-style scenario.',
				},
				{
					type: 'cue',
					text: 'Keep the Red Cross acknowledgement text-only; do not imply Future Together speaks for Australian Red Cross.',
				},
			],
		},
	},
	{
		id: 2,
		title: 'Preparedness works across changing conditions',
		content: (
			<>
				<h2>Preparedness works across changing conditions</h2>
				<div class='large-text'>
					Heat, storms, fire, outages, supply interruptions, rumours and changing technology can overlap.
				</div>
				<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:1050px;width:100%;margin-top:1.25rem;'>
					<div class='info-box' style='margin:0;text-align:center;'>
						<h3 style='font-size:1.3rem;'>Know</h3>
						<p style='font-size:1rem;color:#374151;'>What matters locally?</p>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<h3 style='font-size:1.3rem;'>Check</h3>
						<p style='font-size:1rem;color:#374151;'>What is current and authoritative?</p>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<h3 style='font-size:1.3rem;'>Connect</h3>
						<p style='font-size:1rem;color:#374151;'>Who can help, and how do we reach them?</p>
					</div>
				</div>
				<div class='question' style='margin-top:1.5rem;'>
					Preparation is not prediction.
					<br />
					It is making room to respond well.
				</div>
			</>
		),
		notes: {
			pace: 'Context · ~2 min',
			cumulative: 3.5,
			anchor: 'Establish the all-hazards frame before introducing AI.',
			bullets: [
				{
					type: 'say',
					text: "Australian Red Cross's EmergencyRedi approach is all-hazards: get in the know, get connected, get organised and get packing.",
				},
				{
					type: 'say',
					text: 'We do not need to predict every possible emergency in order to strengthen the basics that help in many situations.',
				},
				{
					type: 'say',
					text: 'Tonight I am adding one small question: when information is moving quickly, how do we know what to trust and how do we stay connected?',
				},
				{ type: 'cue', text: 'Bridge back to the host workshop rather than repeating its content.' },
			],
		},
	},
	{
		id: 3,
		title: 'AI is one changing condition',
		content: (
			<>
				<h2>AI is one changing condition</h2>
				<div class='large-text'>
					AI is software that can recognise patterns and generate text, images, audio or suggestions from large amounts of data.
				</div>
				<p style='font-size:1.25rem;color:#374151;text-align:center;max-width:950px;'>
					It can change how information is created, found and shared.
				</p>
				<div class='split-view' style='margin-top:1rem;'>
					<div class='split-column split-teal'>
						<h3 style='font-size:1.4rem;'>It may help with</h3>
						<p style='font-size:1.15rem;color:#374151;text-align:center;'>search, translation, summarising and drafting</p>
					</div>
					<div class='split-column split-amber'>
						<h3 style='font-size:1.4rem;'>It can also</h3>
						<p style='font-size:1.15rem;color:#374151;text-align:center;'>
							be wrong, incomplete, biased or used for convincing scams and misinformation
						</p>
					</div>
				</div>
				<div class='emphasis-box' style='margin-top:1rem;'>
					<p style='font-size:1.15rem;color:#374151;text-align:center;'>
						Global system decisions may be made far from town, but they are human decisions and can be questioned.
					</p>
				</div>
				<div class='slide-footnotes'>
					<span>
						<sup>1</sup> eSafety Commissioner, <em>Generative AI</em> —
						esafety.gov.au/key-topics/technology-trends-and-data/generative-ai
					</span>
				</div>
			</>
		),
		notes: {
			pace: 'Context · ~2.5 min',
			cumulative: 6,
			anchor: 'Explain AI plainly, without prediction or fatalism.',
			bullets: [
				{
					type: 'say',
					text: 'AI is a broad name for computer systems that use patterns in data to make predictions, recommendations, or new content such as text, images and audio.',
				},
				{
					type: 'say',
					text: 'Many people encounter it through search results, phone tools, customer-service systems, or convincing images and messages online.',
				},
				{
					type: 'say',
					text: 'Some decisions about these systems are made by companies, governments and investors far from Tumbarumba, so no single town can control all of the change.',
				},
				{
					type: 'say',
					text: 'However, these are human decisions, and people can question where AI is used, whether it is fair, and whether it is appropriate.',
				},
				{
					type: 'say',
					text: 'The preparedness response is not to predict one precise AI future; it is to stay capable under changing conditions.',
				},
				{
					type: 'cue',
					text: 'Avoid forecasts, jargon and catastrophe framing. Invite a show of hands only if helpful: who has seen an AI-generated image or message?',
				},
			],
		},
	},
	{
		id: 4,
		title: 'Change will not affect everyone evenly',
		content: (
			<>
				<h2>Change will not affect everyone evenly</h2>
				<div class='large-text'>
					Access, confidence, disability, language, time, devices and local relationships all shape who benefits — and who gets
					left out.
				</div>
				<div class='info-box' style='max-width:1000px;width:100%;margin-top:1.25rem;'>
					<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;text-align:center;'>
						<div>
							<strong>Consent</strong>
							<br />
							<span style='color:#374151;'>People choose how information about them is used.</span>
						</div>
						<div>
							<strong>Accountability</strong>
							<br />
							<span style='color:#374151;'>A person or organisation remains answerable.</span>
						</div>
						<div>
							<strong>Offline options</strong>
							<br />
							<span style='color:#374151;'>No-one is excluded when online systems fail.</span>
						</div>
					</div>
				</div>
				<div class='question' style='margin-top:1.5rem;'>
					Keep local judgement
					<br />
					and relationships in the loop.
				</div>
			</>
		),
		notes: {
			pace: 'Agency · ~2.5 min',
			cumulative: 8.5,
			anchor: 'Emphasise inclusion, agency and offline options.',
			bullets: [
				{
					type: 'say',
					text: 'Changing technology will not affect everyone evenly, because reliable connectivity, disability, language, transport, costs, time and confidence all shape what people can actually use.',
				},
				{
					type: 'say',
					text: 'A service that is convenient for someone with a reliable device and time to spare may be difficult or unavailable for somebody else.',
				},
				{ type: 'say', text: 'Good preparedness preserves choice, voice, privacy and the ability to act offline.' },
				{
					type: 'say',
					text: 'We should ask who checks information, who is accountable for it, and what happens when online systems are unavailable.',
				},
				{ type: 'cue', text: 'Do not ask people to disclose personal circumstances.' },
			],
		},
	},
	{
		id: 5,
		title: 'Practical pressures to plan for',
		content: (
			<>
				<h2>Practical pressures to plan for</h2>
				<div class='large-text'>AI is not the emergency.<br />It can add pressure to systems we already rely on.</div>
				<div style='display:grid;grid-template-columns:1fr 1fr;gap:0.9rem;max-width:1100px;width:100%;margin-top:1rem;'>
					<div class='info-box' style='margin:0;'>
						<h3 style='font-size:1.3rem;'>Information integrity</h3>
						<p style='font-size:1.05rem;color:#374151;text-align:center;'>False or altered messages can look convincing.</p>
					</div>
					<div class='info-box' style='margin:0;'>
						<h3 style='font-size:1.3rem;'>Dependence on services</h3>
						<p style='font-size:1.05rem;color:#374151;text-align:center;'>
							Online-only or automated systems may be unavailable or difficult to use.
						</p>
					</div>
					<div class='info-box' style='margin:0;'>
						<h3 style='font-size:1.3rem;'>Supply chains</h3>
						<p style='font-size:1.05rem;color:#374151;text-align:center;'>
							Disruptions elsewhere can affect local availability.
						</p>
					</div>
					<div class='info-box' style='margin:0;'>
						<h3 style='font-size:1.3rem;'>Access and isolation</h3>
						<p style='font-size:1.05rem;color:#374151;text-align:center;'>
							Patchy coverage, transport and distance can make support harder to reach.
						</p>
					</div>
				</div>
				<div class='emphasis-box' style='margin-top:1rem;'>
					<p style='font-size:1.2rem;color:#374151;text-align:center;'>
						<strong>The practical response is the same: keep options, check sources and stay connected.</strong>
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Practical pressures · ~3 min',
			cumulative: 11.5,
			anchor: 'Translate AI change into practical preparedness pressures.',
			bullets: [
				{
					type: 'say',
					text: 'The most useful way to think about this is through practical pressures, rather than dramatic predictions.',
				},
				{
					type: 'say',
					text: 'Information may be harder to assess because altered images, voice messages and false notices can look convincing.',
				},
				{
					type: 'say',
					text: 'We increasingly rely on digital and automated services for payments, bookings, information and support, and those systems may be unavailable or difficult to use.',
				},
				{
					type: 'say',
					text: 'Supply systems are connected to decisions and disruptions beyond the local area, so essential goods may not always be available in the usual way.',
				},
				{
					type: 'say',
					text: 'Distance, patchy mobile coverage, transport barriers and isolation can also make it harder for people to get timely support.',
				},
				{
					type: 'say',
					text: 'These are not predictions about a particular event; they are reasons to preserve options, check important information directly, and strengthen local connections before they are urgently needed.',
				},
			],
		},
	},
	{
		id: 6,
		title: 'Useful tools need human checking',
		content: (
			<>
				<h2>Useful tools need human checking</h2>
				<div style='display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;max-width:1050px;width:100%;margin-top:1rem;'>
					<div class='info-box' style='margin:0;'>
						<h3 style='font-size:1.35rem;'>AI may help with</h3>
						<ul style='font-size:1.1rem;line-height:1.7;'>
							<li>finding published material</li>
							<li>translation or plain-language drafts</li>
							<li>summarising a long document</li>
						</ul>
					</div>
					<div class='warning-box' style='margin:0;'>
						<h3 style='font-size:1.35rem;'>People must still</h3>
						<ul style='font-size:1.1rem;line-height:1.7;'>
							<li>check the original source</li>
							<li>confirm it is current today</li>
							<li>decide what is appropriate locally</li>
						</ul>
					</div>
				</div>
				<div class='emphasis-box' style='margin-top:1.25rem;'>
					<p style='font-size:1.3rem;color:#374151;text-align:center;'>
						<strong>Pause → source → date → confirm.</strong>
						<br />
						For important information, use a named accountable source and a direct check.
					</p>
				</div>
				<div class='slide-footnotes'>
					<span>
						<sup>1</sup> ACCC Scamwatch — scamwatch.gov.au
					</span>
				</div>
			</>
		),
		notes: {
			pace: 'Practice · ~2.5 min',
			cumulative: 14,
			anchor: 'Establish a simple verification practice before the activity.',
			bullets: [
				{
					type: 'say',
					text: 'AI can sometimes be useful for finding published material, translating a message, producing a plain-language draft, or helping someone identify a question to investigate.',
				},
				{ type: 'say', text: 'However, a confident answer is not the same as a verified answer.' },
				{
					type: 'say',
					text: 'For important information, pause and look for the original named source, check the date, and confirm it directly through an official contact path or source that is accountable for the information.',
				},
				{
					type: 'say',
					text: 'For urgent advice, go directly to the relevant emergency service, council, health service or venue rather than relying on a screenshot, forwarded message or AI summary.',
				},
				{
					type: 'cue',
					text: 'Use Scamwatch only as a general reminder that scams can impersonate trusted organisations; do not imply a local scam is occurring.',
				},
			],
		},
	},
	{
		id: 7,
		title: 'Household basics are the bridge',
		content: (
			<>
				<h2>Household basics are the bridge</h2>
				<div class='large-text'>
					Before a crisis, talk through what you need, who you will contact, and how you will manage if normal systems are
					unavailable.
				</div>
				<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:0.9rem;max-width:1100px;width:100%;margin-top:1.25rem;'>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Know</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>local risks and warnings</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Connect</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>people and support</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Organise</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>plans and information</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Pack</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>what you may need</span>
					</div>
				</div>
				<div class='question' style='margin-top:1.5rem;'>
					Preparedness is practical —<br />
					and it starts before you need it.
				</div>
				<div class='slide-footnotes'>
					<span>
						<sup>1</sup> Australian Red Cross, EmergencyRedi — redcross.org.au/emergencies/prepare/
					</span>
				</div>
			</>
		),
		notes: {
			pace: 'Bridge · ~2 min',
			cumulative: 16,
			anchor: 'Return the emphasis clearly to EmergencyRedi household preparation.',
			bullets: [
				{
					type: 'say',
					text: 'The four words on screen are Red Cross EmergencyRedi headings, and the host workshop is the priority for the practical detail.',
				},
				{ type: 'say', text: 'People do not need to create a separate AI preparedness plan.' },
				{
					type: 'say',
					text: 'We need strong, inclusive preparedness that still works when technology is unreliable or confusing.',
				},
				{
					type: 'say',
					text: 'Our next idea is about shared knowledge that can make these household basics easier to act on locally.',
				},
				{ type: 'cue', text: 'Do not give medical, evacuation or official service advice here.' },
			],
		},
	},
	{
		id: 8,
		title: 'A living local knowledge commons',
		content: (
			<>
				<h2>A living local knowledge commons</h2>
				<div class='large-text'>
					Locally owned, continuously checked knowledge that helps people find their way in changing conditions.
				</div>
				<div class='info-box' style='max-width:1100px;width:100%;margin-top:1rem;'>
					<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:0.9rem;font-size:1.05rem;color:#374151;'>
						<div>
							<strong>What we know</strong>
							<br />
							services, skills, assets and accessible places
						</div>
						<div>
							<strong>What we watch</strong>
							<br />
							hazards, contacts, support networks and pathways
						</div>
						<div>
							<strong>How we maintain it</strong>
							<br />
							owners, review dates, corrections and offline access
						</div>
					</div>
				</div>
				<div class='emphasis-box' style='margin-top:1.15rem;'>
					<p style='font-size:1.2rem;color:#374151;text-align:center;'>
						The valuable thing is not only a directory. It is the ongoing practice of checking, updating and caring for shared
						local knowledge.
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Core idea · ~2.5 min',
			cumulative: 18.5,
			anchor: 'Introduce shared knowledge as maintained local practice, not a static list.',
			bullets: [
				{
					type: 'say',
					text: 'A living local knowledge commons is shared local knowledge that has names, dates and relationships behind it.',
				},
				{
					type: 'say',
					text: 'It might include services, useful skills, community assets, accessible places, support pathways and public communication channels, but only what the community agrees is appropriate to share.',
				},
				{
					type: 'say',
					text: 'People need to know who can update it, who can challenge an error, when it was last reviewed, and how somebody can access it if an online system fails.',
				},
				{ type: 'say', text: 'This session is not creating an official directory, and it is not collecting personal information.' },
				{ type: 'cue', text: 'Make clear this session does not create an official directory or collect personal information.' },
			],
		},
	},
	{
		id: 9,
		title: 'Table activity: one missing local answer',
		content: (
			<>
				<h2>Table activity: one missing local answer</h2>
				<div class='warning-box' style='max-width:1100px;width:100%;margin:0.75rem 0;'>
					<p style='font-size:1.15rem;color:#374151;'>
						<strong>Scenario:</strong> It is a very hot day. Mobile service is patchy and EFTPOS is unreliable. An online rumour
						says a local cooling space has closed. A neighbour asks where an older person needing a cool, accessible place can
						go <strong>today</strong> — and how to know it is open.
					</p>
				</div>
				<div style='display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;max-width:1100px;width:100%;'>
					<div class='info-box' style='margin:0;'>
						<strong>In five minutes, identify:</strong>
						<ol style='margin:0.5rem 0 0 1.25rem;color:#374151;line-height:1.6;font-size:1rem;'>
							<li>One missing local answer</li>
							<li>Best authoritative source</li>
							<li>How to verify it is current today</li>
							<li>Who could keep it current</li>
						</ol>
					</div>
					<div class='emphasis-box' style='margin:0;'>
						<strong>Guardrails</strong>
						<ul style='font-size:0.98rem;line-height:1.55;'>
							<li>Do not write personal contacts, health details or vulnerable-person lists.</li>
							<li>Use a safer scenario if needed.</li>
							<li>Unofficial noticeboards and radio are discussion prompts, not confirmed official channels.</li>
						</ul>
					</div>
				</div>
				<div class='question' style='margin-top:1rem;font-size:2rem;'>
					Choose a useful question —<br />
					not a perfect answer.
				</div>
			</>
		),
		notes: {
			pace: 'Small groups · ~6.5 min',
			cumulative: 25,
			anchor: 'Have tables identify a reliable-answer pattern, not solve or publish a local directory.',
			bullets: [
				{ type: 'say', text: 'You have five minutes to discuss this with your table.' },
				{
					type: 'say',
					text: 'Your task is not to solve the scenario perfectly or to create an official local directory; it is to identify one missing local answer and the safest way to make that answer reliable.',
				},
				{
					type: 'say',
					text: 'Please consider who is accountable for the information, how someone could check that it is current today, and who might help keep it updated.',
				},
				{
					type: 'say',
					text: 'The scenario is not a claim about a current local cooling space, and you may choose another low-risk preparedness question if it is not useful for your table.',
				},
				{
					type: 'say',
					text: 'Please do not write personal contact details, health information or lists of people who may be vulnerable.',
				},
				{
					type: 'cue',
					text: 'Circulate. Redirect any attempt to create personal lists. Do not collect the cards as a public directory.',
				},
			],
		},
	},
	{
		id: 10,
		title: 'Share back: test the pattern',
		content: (
			<>
				<h2>Share back: test the pattern</h2>
				<div class='large-text'>A strong local answer usually has four parts:</div>
				<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:0.85rem;max-width:1100px;width:100%;margin-top:1.25rem;'>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Question</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>What is missing?</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Source</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>Who is accountable?</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Today check</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>How is it confirmed?</span>
					</div>
					<div class='info-box' style='margin:0;text-align:center;'>
						<strong>Steward</strong>
						<br />
						<span style='font-size:0.95rem;color:#374151;'>Who maintains it?</span>
					</div>
				</div>
				<div class='question' style='margin-top:1.5rem;'>
					What would make this answer
					<br />
					safer, clearer and easier to use?
				</div>
			</>
		),
		notes: {
			pace: 'Share back · ~2.5 min',
			cumulative: 27.5,
			anchor: 'Draw out the reliability pattern without validating unverified claims.',
			bullets: [
				{ type: 'say', text: 'Let us hear two or three insights from the tables.' },
				{
					type: 'say',
					text: 'Please share the question you identified and the pattern you used, rather than presenting an unverified local service as a recommendation.',
				},
				{
					type: 'say',
					text: 'A strong local answer usually has four parts: a clear question, an accountable source, a way to check that information today, and someone or some organisation that can help maintain it.',
				},
				{
					type: 'say',
					text: 'If a service or location is mentioned and it has not been confirmed, we will treat it as a lead to verify rather than advice for others to follow.',
				},
				{
					type: 'cue',
					text: 'If a contribution names an unverified service, thank the table and restate it as a lead to verify, not a recommendation.',
				},
			],
		},
	},
	{
		id: 11,
		title: 'AI can help; people remain responsible',
		content: (
			<>
				<h2>AI can help; people remain responsible</h2>
				<div class='split-view' style='margin-top:0.75rem;'>
					<div class='split-column split-teal'>
						<h3 style='font-size:1.35rem;'>AI may support</h3>
						<p style='font-size:1.08rem;color:#374151;text-align:center;'>
							searching verified material, translation, plain-language drafts and finding gaps to investigate
						</p>
					</div>
					<div class='split-column split-amber'>
						<h3 style='font-size:1.35rem;'>People remain responsible for</h3>
						<p style='font-size:1.08rem;color:#374151;text-align:center;'>
							truth and context, consent and accountability, relationships and offline options
						</p>
					</div>
				</div>
				<div class='emphasis-box' style='margin-top:0.9rem;'>
					<p style='font-size:1.2rem;color:#374151;text-align:center;'>
						Technology can make shared knowledge easier to use.{' '}<br />
						<strong>It cannot do the caring, checking and showing up for us.</strong>
					</p>
				</div>
				<div class='info-box' style='max-width:1000px;width:100%;text-align:center;margin:0.75rem 0 0;'>
					<p style='font-size:1.05rem;color:#374151;'>
						<strong>Next: continue with the Australian Red Cross EmergencyRedi workshop.</strong>
						<br />
						Build household readiness, check important information directly, and stay connected locally.
					</p>
					<p style='font-size:1rem;color:#374151;margin-top:0.55rem;'>
						<strong>Hosted by Australian Red Cross</strong>
						<br />
						Supported locally by Future Together
					</p>
					<p style='font-size:0.72rem;font-weight:700;color:#c4853a;overflow-wrap:anywhere;'>
						futuretogether.community/events/working-together-to-prepare-for-emergencies-2026-09-15
					</p>
				</div>
			</>
		),
		notes: {
			pace: 'Close and transition · ~2.5 min',
			cumulative: 30,
			anchor: 'Close the bounded-AI message and hand clearly back to EmergencyRedi.',
			bullets: [
				{
					type: 'say',
					text: 'AI can help with bounded tasks, such as finding verified material, translating information, drafting a plain-language version, or identifying a gap that needs further checking.',
				},
				{ type: 'say', text: 'People remain responsible for what is true, current, fair and appropriate for the local situation.' },
				{
					type: 'say',
					text: 'Technology can make shared knowledge easier to use, but it cannot do the caring, checking and showing up for one another.',
				},
				{
					type: 'say',
					text: 'Thank you for taking part in this conversation; the most useful next step is to continue with the Australian Red Cross EmergencyRedi workshop and apply its practical guidance to your own household and community connections.',
				},
				{ type: 'cue', text: 'Slow down on the final sentence and hand directly to the EmergencyRedi facilitator.' },
			],
		},
	},
];

export const meta: SlideshowMeta = {
	slug: 'tumbarumba-emergency-redi-september-2026',
	title: 'Working Together to Prepare for Emergencies',
	eventSlug: 'working-together-to-prepare-for-emergencies-2026-09-15',
	slideCount: 11,
	durationMinutes: 30,
	description:
		'A Future Together segment on AI, trusted information and community preparedness, hosted within an Australian Red Cross EmergencyRedi workshop in Tumbarumba.',
};

export const loadSlides = () => Promise.resolve(slides);
