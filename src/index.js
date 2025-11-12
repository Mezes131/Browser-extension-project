import AUTH_TOKEN from '../.env';

document.addEventListener('DOMContentLoaded', () => {
	const regionInput = document.querySelector('.region-name');
	// Select the <select id="data_type"> element
	const data_type_input = document.querySelector('#data_type');
	const form = document.querySelector('.form-data');
	const errorsDiv = document.querySelector('.errors');
	const clearBtn = document.querySelector('.clear-btn');

	if (!regionInput || !data_type_input || !form) return;

	// data_type is a <select> for choosing which endpoint to call; do not hide it

	// Validation helpers
	const allowedDataTypes = ['carbon-intensity', 'electricity-mix'];
	function validateDataType(value) {
		return typeof value === 'string' && allowedDataTypes.includes(value);
	}

	// Region code formats like 'US-NEISO' or 'CM'
	// Rule: starts with two letters country code, optionally followed by one or more '-SEG' groups
	function validateRegionCode(value) {
		if (typeof value !== 'string') return false;
		const v = value.trim().toUpperCase();
		const re = /^[A-Z]{2}(?:-[A-Z0-9]+)*$/;
		return re.test(v);
	}

	// Visual feedback
	function setValidity(el, valid) {
		if (!el) return;
		el.style.outline = 'none';
		el.style.borderWidth = '2px';
		el.style.borderStyle = 'solid';
		el.style.borderColor = valid ? 'green' : 'red';
		el.setAttribute('aria-invalid', (!valid).toString());
	}

	function clearValidity(el) {
		if (!el) return;
		el.style.borderColor = '';
		el.style.borderWidth = '';
		el.style.borderStyle = '';
		el.removeAttribute('aria-invalid');
	}

	// Live validation
	regionInput.addEventListener('input', () => {
		const ok = validateRegionCode(regionInput.value);
		setValidity(regionInput, ok);
	});

	// For a select, validate on change
	data_type_input.addEventListener('change', () => {
		const ok = validateDataType(data_type_input.value);
		setValidity(data_type_input, ok);
	});

	// Form submit handling
	form.addEventListener('submit', (e) => {
		errorsDiv.textContent = '';
	const data_type_ok = validateDataType(data_type_input.value);
		const regionOk = validateRegionCode(regionInput.value);

		if (!data_type_ok || !regionOk) {
			e.preventDefault();
			if (!regionOk) {
				const p = document.createElement('p');
				p.textContent = 'Region code invalid. Use formats like "US-NEISO" or "CM".';
				errorsDiv.appendChild(p);
			}
				if (!data_type_ok) {
					const p = document.createElement('p');
					p.textContent = 'Please select a valid data type.';
					errorsDiv.appendChild(p);
				}
			errorsDiv.style.color = 'red';
			errorsDiv.setAttribute('role', 'alert');
			setValidity(regionInput, regionOk);
			setValidity(data_type_input, data_type_ok);
			return false;
		}

			// If valid, ensure visual state is green and perform the data-type fetch via background
			e.preventDefault();
			setValidity(regionInput, true);
			setValidity(data_type_input, true);
			errorsDiv.textContent = '';

			const loading = document.querySelector('.loading');
			const dataDiv = document.querySelector('.data');
			const resultContainer = document.querySelector('.result-container');
			if (loading) loading.style.display = 'block';
			if (dataDiv) dataDiv.textContent = '';

			const payload = {
				action: 'fetchCarbon',
				data_type: data_type_input.value, // exact value from select
				region: regionInput.value.trim(),
			};

			function handleResponse(response) {
				if (loading) loading.style.display = 'none';
				if (!response) {
					errorsDiv.textContent = 'No response from background.';
					return;
				}
				if (!response.ok) {
					errorsDiv.textContent = response.error || 'Failed to fetch data.';
					return;
				}
				const json = response.data || response.json || response;
				// Best-effort extraction of common fields; adjust depending on data-type shape
				const zone = json.zone || json.data?.zone || regionInput.value.trim();
				const carbon = (json.carbonIntensity ?? json.data?.carbonIntensity ?? json.mean ?? json.carbon) || 'N/A';
				const fossil = (json.fossilFuelPercentage ?? json.data?.fossil ?? json.fossilFuel ?? 'N/A');

				if (resultContainer) resultContainer.style.display = 'block';
				const myRegion = document.querySelector('.my-region');
				const carbonUsage = document.querySelector('.carbon-usage');
				const fossilFuel = document.querySelector('.fossil-fuel');
				if (myRegion) myRegion.textContent = zone;
				if (carbonUsage) carbonUsage.textContent = carbon;
				if (fossilFuel) fossilFuel.textContent = fossil;
			}

			// Prefer using the extension background to keep data-type key out of page context
			if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
				try {
					chrome.runtime.sendMessage(payload, (resp) => {
						handleResponse(resp);
					});
				} catch (err) {
					// fallback to direct fetch (best-effort, may require a stored API key)
					fetchDirect(payload.region).then(handleResponse).catch((e) => {
						if (loading) loading.style.display = 'none';
						errorsDiv.textContent = e.message || String(e);
					});
				}
			} else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
				browser.runtime.sendMessage(payload).then(handleResponse).catch((e) => {
					if (loading) loading.style.display = 'none';
					errorsDiv.textContent = e.message || String(e);
				});
			} else {
				// No extension runtime available; try direct fetch (no API key provided)
				fetchDirect(payload.region).then(handleResponse).catch((e) => {
					if (loading) loading.style.display = 'none';
					errorsDiv.textContent = e.message || String(e);
				});
			}

			return false;
	});

		// Helper to call the ElectricityMaps data-type directly if the background is not available
		function fetchDirect(region, data_type) {
			const url = `https://api.electricitymaps.com/v3/${encodeURIComponent(data_type)}/latest?zone=${encodeURIComponent(region)}`;
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'auth-token': AUTH_TOKEN,
                    }
                })
				.then(res => res.json())
				.catch((err) => ({ ok: false, error: err.message }));
		}

	// Reset/clear behavior
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			clearValidity(regionInput);
			clearValidity(data_type_input);
			errorsDiv.textContent = '';
			try { /* nothing to reset for a select */ } catch (e) {}
		});
	}
});

