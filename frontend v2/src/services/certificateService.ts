// Lightweight mapping and fetch-based service (no TypeScript runtime types)
function mapBackendCertToFrontend(b) {
  if (!b) return null;
  return {
    id: b.id || b._id,
    recipientName: b.name,
    title: b.course,
    year: b.year,
    issuedAt: b.issuedAt,
    issuerName: b.issuedBy,
    status: b.revoked ? 'revoked' : 'valid',
    tokenId: b.tokenId,
    transactionHash: b.transactionHash,
    // Enhanced fields
    grade: b.grade,
    description: b.description,
    certificateType: b.certificateType,
    institution: b.institution,
    honors: b.honors,
    studentEmail: b.studentEmail,
    recipientAddress: b.walletAddress,
    registrationNumber: b.registrationNumber,
  };
}

const handleJson = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
};

export const certificateService = {
  async getMyCertificates(address) {
    const res = await fetch('/certificates', { method: 'GET', credentials: 'include' });
    if (!res.ok) {
      const body = await handleJson(res);
      throw new Error(body && body.error ? body.error : 'Failed to fetch certificates');
    }
    const data = await res.json();
    const certs = (data.certificates || data || []);
    return certs.map(mapBackendCertToFrontend);
  },

  async verifyCertificate(hashOrId) {
    const idMatch = /^[a-f0-9]{10}$/i.test(String(hashOrId).trim());
    if (!idMatch) {
      return null;
    }

    const res = await fetch(`/certificates/verify/${hashOrId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const body = await handleJson(res);
      throw new Error(body && body.error ? body.error : 'Verification failed');
    }

    const body = await res.json();
    if (!body || !body.valid) return body; // Return body to show errors/reasons
    return {
      ...body,
      certificate: mapBackendCertToFrontend(body.certificate)
    };
  },

  async issueCertificate(data) {
    const payload = {
      name: data.recipientName,
      course: data.title,
      year: data.year || new Date().getFullYear().toString(),
      studentEmail: data.studentEmail,
      walletAddress: data.recipientAddress,
      // Enhanced fields
      grade: data.grade,
      description: data.description,
      certificateType: data.certificateType,
      institution: data.institution,
      honors: data.honors,
      registrationNumber: data.registrationNumber,
      registrarAddress: data.registrarAddress,
    };

    const res = await fetch('/certificates/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!res.ok) {
      const body = await handleJson(res);
      throw new Error(body && body.error ? body.error : 'Issue certificate failed');
    }

    const body = await res.json();
    return mapBackendCertToFrontend(body.certificate);
  },

  async getCertificateById(id) {
    return await this.verifyCertificate(id);
  },
};
