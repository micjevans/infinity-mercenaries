import { useEffect, useMemo, useState } from "react";
import { createLocalCompany, deleteLocalCompany, loadLocalCompanies, type LocalCompany } from "../lib/mercs/companyStore";
import { AppIcon } from "./AppIcon";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getCompanyHref(companyId: string): string {
  return `/companies/manage/?id=${encodeURIComponent(companyId)}`;
}

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setCompanies(loadLocalCompanies());
  }, []);

  const filteredCompanies = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((company) => company.name.toLowerCase().includes(normalized));
  }, [companies, searchTerm]);

  function handleCreateCompany() {
    const name = newCompanyName.trim();
    if (!name) return;

    const company = createLocalCompany({ name });
    const nextCompanies = [...companies, company];
    window.localStorage.setItem("mercenaries.localCompanies.v1", JSON.stringify(nextCompanies));
    setCompanies(nextCompanies);
    setNewCompanyName("");
    window.location.href = getCompanyHref(company.id);
  }

  function handleDeleteCompany(companyId: string) {
    setCompanies(deleteLocalCompany(companyId));
  }

  return (
    <section className="company-manager company-list-page" aria-label="Company list">
      <div className="company-manager__masthead">
        <p className="eyebrow">Company Command</p>
        <h1>Companies</h1>
        <p>Create and open local mercenary companies. The detailed manager lives on its own page so the workspace has room to breathe.</p>
      </div>

      <div className="company-list-layout">
        <section className="company-section-card company-create-card">
          <span className="panel-kicker">Local Storage</span>
          <h2>Create Company</h2>
          <form
            className="company-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateCompany();
            }}
          >
            <label className="field">
              <span>Company Name</span>
              <input value={newCompanyName} onChange={(event) => setNewCompanyName(event.target.value)} placeholder="Company name" />
            </label>
            <button className="command-button command-button--primary" type="submit" disabled={!newCompanyName.trim()}>
              Create and Open
            </button>
          </form>
        </section>

        <section className="company-section-card company-index-card">
          <div className="section-heading-row">
            <div>
              <span className="panel-kicker">Saved Companies</span>
              <h2>Roster Files</h2>
            </div>
            <span className="company-count">{companies.length}</span>
          </div>

          <label className="field">
            <span>Search</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find a company" />
          </label>

          <div className="company-card-list">
            {filteredCompanies.map((company) => (
              <article className="company-index-item" key={company.id}>
                <a href={getCompanyHref(company.id)}>
                  <span className="panel-kicker">{company.sectorial1?.name || "No sectorial selected"}</span>
                  <h3>{company.name}</h3>
                  <p>
                    {company.troopers?.length || 0} troopers. Updated {formatDate(company.updatedAt)}.
                  </p>
                </a>
                <button className="command-button command-button--danger" type="button" onClick={() => handleDeleteCompany(company.id)}>
                  <AppIcon name="trash" size={16} />
                  Delete
                </button>
              </article>
            ))}
            {filteredCompanies.length === 0 && <p className="empty-note">No companies found.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
