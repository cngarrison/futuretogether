import { JSX } from 'preact';
import { useState } from 'preact/hooks';

interface CancelRegistrationButtonProps {
	eventSlug: string;
	eventId: string;
	registrationId: string;
	attendeeEmail: string;
	onCancelled?: () => void;
}

export default function CancelRegistrationButton({
	eventSlug,
	eventId,
	registrationId,
	attendeeEmail,
	onCancelled,
}: CancelRegistrationButtonProps): JSX.Element {
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleCancel = async () => {
		setIsLoading(true);
		setError('');

		try {
			const response = await fetch(`/api/staff/events/${eventSlug}/cancel`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId, registrationId }),
				credentials: 'same-origin',
			});
			console.log('CancelRegistrationButton', response);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to cancel registration');
			}

			// Reload page to show updated status
			globalThis.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			setIsLoading(false);
		}
	};

	return (
		<>
			<button
				class="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				onClick={() => setShowConfirm(true)}
				disabled={isLoading}
			>
				{isLoading ? 'Cancelling...' : 'Cancel'}
			</button>

			{showConfirm && (
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div class="bg-white rounded-lg p-6 max-w-md w-full overflow-hidden">
						<h3 class="text-xl font-bold text-gray-900 mb-4">
							Cancel Registration?
						</h3>
						<p class="text-gray-600 mb-2 break-words">
							Are you sure you want to cancel the registration for:
						</p>
						<p class="font-semibold text-gray-900 mb-4 break-all">
							{attendeeEmail}
						</p>
						<p class="text-gray-600 mb-6 break-words whitespace-normal">
							The registration will be marked as cancelled but kept in the system for records.
						</p>

						{error && (
							<div class="bg-red-50 border border-red-200 rounded p-3 mb-4">
								<p class="text-red-800 text-sm">{error}</p>
							</div>
						)}

						<div class="flex gap-3 justify-end">
							<button
								class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
								onClick={() => {
									setShowConfirm(false);
									setError('');
								}}
								disabled={isLoading}
							>
								No, Keep It
							</button>
							<button
								class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleCancel}
								disabled={isLoading}
							>
								{isLoading ? 'Cancelling...' : 'Yes, Cancel Registration'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}