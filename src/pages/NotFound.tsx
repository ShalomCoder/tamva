import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Not found" subtitle="That page or record does not exist in this workspace." />
      <div className="card">
        <div className="state-block">
          <div className="state-block__icon">
            <Icon name="circle-alert" size={20} />
          </div>
          <p className="state-block__title">404</p>
          <p className="text-secondary">Check the URL, or head back to the dashboard.</p>
          <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
