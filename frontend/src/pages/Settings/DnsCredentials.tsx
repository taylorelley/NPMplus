import { IconPencil, IconTrash } from "@tabler/icons-react";
import { deleteDnsCredential } from "src/api/backend";
import { Button, Loading } from "src/components";
import { useDnsCredentials, useDnsProviders } from "src/hooks";
import { T } from "src/locale";
import { showDeleteConfirmModal, showDnsCredentialModal } from "src/modals";
import { showObjectSuccess } from "src/notifications";

export default function DnsCredentials() {
	const { data: dnsProviders, isLoading: providersLoading } = useDnsProviders();
	const { data: savedCredentials, isLoading: credentialsLoading, error } = useDnsCredentials();

	const handleDelete = async (id: number) => {
		await deleteDnsCredential(id);
		showObjectSuccess("dns-credentials", "deleted");
	};

	return (
		<div className="card-body">
			<h3 className="card-title">
				<T id="settings.dns-credentials.title" />
			</h3>
			<p className="text-muted">
				<T id="settings.dns-credentials.description" />
			</p>

			<div className="mb-3">
				<Button actionType="primary" onClick={() => showDnsCredentialModal("new")}>
					<T id="object.add" tData={{ object: "dns-credentials" }} />
				</Button>
			</div>

			<h4>
				<T id="settings.dns-credentials.saved" />
			</h4>

			{providersLoading || credentialsLoading ? <Loading noLogo /> : null}
			{error ? <p className="text-danger">{error.message}</p> : null}

			{!credentialsLoading && !error ? (
				savedCredentials?.length ? (
					<div className="table-responsive">
						<table className="table table-vcenter">
							<thead>
								<tr>
									<th>
										<T id="settings.dns-credentials.name" />
									</th>
									<th>
										<T id="settings.dns-credentials.provider" />
									</th>
									<th className="w-1">
										<T id="settings.dns-credentials.columns.actions" />
									</th>
								</tr>
							</thead>
							<tbody>
								{savedCredentials.map((cred) => {
									const provider = dnsProviders?.find((p) => p.id === cred.providerId);

									return (
										<tr key={cred.id}>
											<td className="text-break">{cred.name}</td>
											<td>{provider?.name || cred.providerId}</td>
											<td className="text-nowrap">
												<Button
													variant="action"
													size="sm"
													onClick={() => showDnsCredentialModal(cred.id)}
												>
													<IconPencil size={16} />
												</Button>
												<Button
													variant="action"
													size="sm"
													onClick={() =>
														showDeleteConfirmModal({
															title: (
																<T
																	id="object.delete"
																	tData={{ object: "dns-credentials" }}
																/>
															),
															children: (
																<T
																	id="object.delete.content"
																	tData={{ object: "dns-credentials" }}
																/>
															),
															subject: cred.name,
															onConfirm: () => handleDelete(cred.id),
															invalidations: [
																["dns-credentials"],
																["dns-credential", cred.id],
																["audit-logs"],
															],
														})
													}
												>
													<IconTrash size={16} />
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-muted">
						<T id="settings.dns-credentials.none" />
					</p>
				)
			) : null}
		</div>
	);
}
