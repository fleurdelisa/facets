"use client";

import { RATING_LABELS, childMap, durationLabel, formatPeriod, ratingArcPath, statusLabel, type TreeNode } from "@/lib/tree";
import type { Skill, TreeData } from "@/lib/types";

interface Props {
  node: TreeNode;
  data: TreeData;
  now: Date;
  editable: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onEdit: (skill: Skill) => void;
  onEditSelf: () => void;
  onAdd: (defaults: { branchId?: string; parentId?: string | null }) => void;
  onDelete: (id: string) => void;
  onDeleteBranch: (id: string) => void;
}

function RatingMeter({ rating }: { rating: number }) {
  return (
    <div className="st-meter">
      <svg viewBox="-34 -34 68 24" width="92" height="32" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={ratingArcPath(28, i)} className={`st-meter-arc ${i < rating ? "is-filled" : ""}`} />
        ))}
      </svg>
      <div>
        <div className="st-meter-label">{RATING_LABELS[Math.max(0, Math.min(4, rating - 1))]}</div>
        <div className="st-muted">{rating} / 5 self-rating</div>
      </div>
    </div>
  );
}

function SkillLink({ skill, onSelect }: { skill: Skill; onSelect: (id: string) => void }) {
  return (
    <li>
      <button type="button" className="st-link" onClick={() => onSelect(skill.id)}>
        {skill.name}
      </button>
    </li>
  );
}

export default function DetailPanel(props: Props) {
  const { node, data, now, editable, onClose, onSelect } = props;
  const kids = childMap(data);

  let body: React.ReactNode;
  if (node.kind === "self") {
    const active = data.skills.filter((s) => s.lastActive === "present").length;
    body = (
      <>
        <span className="st-kicker">Self</span>
        <h2>{data.self.name}</h2>
        <p className="st-muted">{data.self.title}</p>
        {data.self.bio && <p>{data.self.bio}</p>}
        <dl className="st-stats">
          <div>
            <dt>Skills</dt>
            <dd>{data.skills.length}</dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd>{active}</dd>
          </div>
          <div>
            <dt>Branches</dt>
            <dd>{data.branches.length}</dd>
          </div>
        </dl>
        {editable && (
          <div className="st-actions">
            <button type="button" className="st-btn" onClick={props.onEditSelf}>
              Edit profile
            </button>
            <button type="button" className="st-btn" onClick={() => props.onAdd({})}>
              + Skill
            </button>
          </div>
        )}
      </>
    );
  } else if (node.kind === "branch") {
    const skills = data.skills.filter((s) => s.branchId === node.branch.id);
    body = (
      <>
        <span className="st-kicker">Branch</span>
        <h2>{node.branch.name}</h2>
        {skills.length ? (
          <ul className="st-list">
            {skills.map((s) => (
              <SkillLink key={s.id} skill={s} onSelect={onSelect} />
            ))}
          </ul>
        ) : (
          <p className="st-muted">No skills yet.</p>
        )}
        {editable && (
          <div className="st-actions">
            <button type="button" className="st-btn" onClick={() => props.onAdd({ branchId: node.branch.id })}>
              + Skill here
            </button>
            {skills.length === 0 && (
              <button type="button" className="st-btn st-btn-danger" onClick={() => props.onDeleteBranch(node.branch.id)}>
                Delete branch
              </button>
            )}
          </div>
        )}
      </>
    );
  } else {
    const { skill, branch } = node;
    const parent = skill.parentId ? data.skills.find((s) => s.id === skill.parentId) : undefined;
    const children = kids.get(skill.id) ?? [];
    body = (
      <>
        <span className="st-kicker">{branch.name}</span>
        <h2>{skill.name}</h2>
        <RatingMeter rating={skill.rating} />
        <dl className="st-facts">
          <div>
            <dt>Period</dt>
            <dd>
              {formatPeriod(skill)} <span className="st-muted">· {durationLabel(skill, now)}</span>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(skill, now)}</dd>
          </div>
        </dl>
        {skill.note && <p>{skill.note}</p>}
        {!!skill.credentials?.length && (
          <section>
            <h3>Credentials</h3>
            <ul className="st-creds">
              {skill.credentials.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        )}
        {parent && (
          <section>
            <h3>Grew from</h3>
            <ul className="st-list">
              <SkillLink skill={parent} onSelect={onSelect} />
            </ul>
          </section>
        )}
        {children.length > 0 && (
          <section>
            <h3>Led to</h3>
            <ul className="st-list">
              {children.map((c) => (
                <SkillLink key={c.id} skill={c} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        )}
        {editable && (
          <div className="st-actions">
            <button type="button" className="st-btn" onClick={() => props.onEdit(skill)}>
              Edit
            </button>
            <button type="button" className="st-btn" onClick={() => props.onAdd({ branchId: branch.id, parentId: skill.id })}>
              + Follow-up skill
            </button>
            <button
              type="button"
              className="st-btn st-btn-danger"
              onClick={() => {
                if (confirm(`Delete “${skill.name}”?`)) props.onDelete(skill.id);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="st-panel" aria-label="Details" onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" className="st-close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      {body}
    </aside>
  );
}
