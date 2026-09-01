import { IconAlertTriangle } from "@tabler/icons-react";
import { Field, useFormikContext } from "formik";
import { useRef, useState } from "react";
import Select, { type ActionMeta } from "react-select";
import type { DNSProvider } from "src/api/backend";
import { getDnsCredential } from "src/api/backend";
import { useDnsCredentials, useDnsProviders, useUser } from "src/hooks";
import { intl, T } from "src/locale";
import styles from "./DNSProviderFields.module.css";

interface DNSProviderOption {
	readonly value: string;
	readonly label: string;
	readonly credentials: string;
}

interface SavedCredentialOption {
	readonly value: number;
	readonly label: string;
}

interface Props {
	showBoundaryBox?: boolean;
}
export function DNSProviderFields({ showBoundaryBox = false }: Props) {
	const { values, setFieldValue } = useFormikContext();
	const { data: dnsProviders, isLoading } = useDnsProviders();
	const { data: currentUser } = useUser("me");
	// Saved credentials live behind the admin only settings api, asking for them
	// as a non-admin would answer 403 and log the user straight back out.
	const { data: savedCredentials } = useDnsCredentials({
		enabled: currentUser?.roles?.includes("admin") === true,
	});
	const [dnsProviderId, setDnsProviderId] = useState<string | null>(null);
	const [savedCreds, setSavedCreds] = useState<SavedCredentialOption | null>(null);
	const [isFetchingSavedCredential, setIsFetchingSavedCredential] = useState(false);
	// Bumped on every provider or saved-credential change, so a credential fetch
	// that resolves after the user has moved on can tell it is stale and skip
	// writing its (now wrong) result into the form.
	const fetchTokenRef = useRef(0);

	const v: any = values || {};

	const handleChange = (newValue: any, _actionMeta: ActionMeta<DNSProviderOption>) => {
		fetchTokenRef.current += 1;
		void setFieldValue("meta.dnsProvider", newValue?.value);
		void setFieldValue("meta.dnsProviderCredentials", newValue?.credentials);
		setSavedCreds(null);
		setDnsProviderId(newValue?.value);
		setIsFetchingSavedCredential(false);
	};

	const handleSavedCredentialChange = async (
		newValue: SavedCredentialOption | null,
		_actionMeta: ActionMeta<SavedCredentialOption>,
	) => {
		const token = ++fetchTokenRef.current;
		setSavedCreds(newValue);

		if (!newValue) {
			// Clearing the selection falls back to the providers credentials
			// template rather than leaving the user with an empty box.
			setIsFetchingSavedCredential(false);
			const providerTemplate = dnsProviders?.find((p: DNSProvider) => p.id === dnsProviderId)?.credentials ?? "";
			void setFieldValue("meta.dnsProviderCredentials", providerTemplate);
			return;
		}

		// The list endpoint never carries the stored secret, so fetch the one
		// credential the admin picked instead of shipping every saved secret to
		// the browser up front.
		setIsFetchingSavedCredential(true);
		try {
			const credential = await getDnsCredential(newValue.value);
			if (fetchTokenRef.current !== token) {
				// The provider or selection changed while this was in flight;
				// applying it now would overwrite what the user picked instead.
				return;
			}
			void setFieldValue("meta.dnsProviderCredentials", credential.credentials ?? "");
		} finally {
			if (fetchTokenRef.current === token) {
				setIsFetchingSavedCredential(false);
			}
		}
	};

	const options: DNSProviderOption[] =
		dnsProviders?.map((p: DNSProvider) => ({
			value: p.id,
			label: p.name,
			credentials: p.credentials,
		})) || [];

	// Filter saved credentials by the selected DNS provider
	const savedCredentialOptions: SavedCredentialOption[] =
		savedCredentials
			?.filter((cred) => cred.providerId === dnsProviderId)
			.map((cred) => ({
				value: cred.id,
				label: cred.name,
			})) || [];
	const showSavedCredentialsDropdown = Boolean(dnsProviderId) && savedCredentialOptions.length > 0;

	return (
		<div className={showBoundaryBox ? styles.dnsChallengeWarning : undefined}>
			<p className="text-warning">
				<IconAlertTriangle size={16} className="me-1" />
				<T id="certificates.dns.warning" />
			</p>

			<Field name="meta.dnsProvider">
				{({ field }: any) => (
					<div className="row">
						<label htmlFor="dnsProvider" className="form-label">
							<T id="certificates.dns.provider" />
						</label>
						<Select
							className="react-select-container"
							classNamePrefix="react-select"
							name={field.name}
							inputId="dnsProvider"
							closeMenuOnSelect={true}
							isClearable={false}
							placeholder={intl.formatMessage({ id: "certificates.dns.provider.placeholder" })}
							isLoading={isLoading}
							isSearchable
							onChange={handleChange}
							options={options}
						/>
					</div>
				)}
			</Field>

			{dnsProviderId ? (
				<>
					{showSavedCredentialsDropdown && (
						<div className="mt-3">
							<label htmlFor="savedCredential" className="form-label">
								<T id="certificates.dns.saved-credentials" />
							</label>
							<Select
								className="react-select-container"
								classNamePrefix="react-select"
								inputId="savedCredential"
								closeMenuOnSelect={true}
								isClearable={true}
								isLoading={isFetchingSavedCredential}
								isDisabled={isFetchingSavedCredential}
								placeholder={intl.formatMessage({
									id: "certificates.dns.saved-credentials.placeholder",
								})}
								value={savedCreds}
								isSearchable={false}
								onChange={handleSavedCredentialChange}
								options={savedCredentialOptions}
							/>
							<small className="text-muted">
								<T id="certificates.dns.saved-credentials-note" />
							</small>
						</div>
					)}
					<Field name="meta.dnsProviderCredentials">
						{({ field }: any) => (
							<div className="mt-3">
								<label htmlFor="dnsProviderCredentials" className="form-label">
									<T id="certificates.dns.credentials" />
								</label>
								<textarea
									className="form-control"
									spellCheck={false}
									id="dnsProviderCredentials"
									style={{
										fontFamily:
											"ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
										borderRadius: "0.3rem",
										minHeight: "130px",
										backgroundColor: "var(--tblr-bg-surface-dark)",
									}}
									value={v.meta.dnsProviderCredentials || ""}
									{...field}
								/>
								<div>
									<small className="text-muted">
										<T id="certificates.dns.credentials-note" />
									</small>
								</div>
								<div>
									<small className="text-danger">
										<T id="certificates.dns.credentials-warning" />
									</small>
								</div>
							</div>
						)}
					</Field>
					<Field name="meta.propagationSeconds">
						{({ field }: any) => (
							<div className="mt-3">
								<label htmlFor="propagationSeconds" className="form-label">
									<T id="certificates.dns.propagation-seconds" />
								</label>
								<input
									id="propagationSeconds"
									type="number"
									className="form-control"
									min={0}
									max={7200}
									{...field}
								/>
								<small className="text-muted">
									<T id="certificates.dns.propagation-seconds-note" />
								</small>
							</div>
						)}
					</Field>
				</>
			) : null}
		</div>
	);
}
