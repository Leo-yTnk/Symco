import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { Database, Project } from "../../domain/model";
import {
  formatDate,
  progress,
  projectClient,
  stageName,
  userName,
} from "../../domain/selectors";
import { healthLabels, projectStatusLabels } from "../../domain/model";

export function ProjectCard({
  database,
  project,
  navigate,
}: {
  database: Database;
  project: Project;
  navigate: (path: string) => void;
}) {
  const value = progress(database, project.id);
  return (
    <button
      className="os-project-card"
      onClick={() => navigate(`/app/projects/${project.id}`)}
    >
      <div className={`os-cover cover-${project.kind}`}>
        <span>
          {projectClient(database, project).slice(0, 2).toUpperCase()}
        </span>
        <span className={`os-badge status-${project.status}`}>
          {projectStatusLabels[project.status]}
        </span>
      </div>
      <div className="os-project-body">
        <small>{projectClient(database, project)}</small>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="os-project-meta">
          <span>{stageName(database, project)}</span>
          <span>{healthLabels[project.health]}</span>
        </div>
        <div className="os-progress-label">
          <span>Progresso</span>
          <strong>{value}%</strong>
        </div>
        <div className="os-progress">
          <span style={{ width: `${value}%` }} />
        </div>
        <footer>
          <span className="os-avatar mini">
            {userName(database, project.ownerId)
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span>{userName(database, project.ownerId)}</span>
          <span className="os-card-date">
            <CalendarDays size={13} />
            {formatDate(project.dueDate)}
          </span>
          <ArrowUpRight size={16} />
        </footer>
      </div>
    </button>
  );
}
