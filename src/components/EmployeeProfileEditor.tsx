import { useEffect, useState } from "react";
import type { Employee } from "../new-api";
import { api, errorText, type Option } from "../api";
import "../style.css";
import { ErrorBox } from "./ErrorBox";

type EmployeeProfile = Employee & { description: string };

export function EmployeeProfileEditor({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  const [profile, setProfile] = useState<EmployeeProfile>();
  const [description, setDescription] = useState("");
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get<EmployeeProfile>("/employees/profile/me")
      .then(({ data }) => {
        if (!active) return;
        setProfile(data);
        setDescription(data.description);
        setSpecializationIds(data.specialization.map((service) => service.id));
        setRegionIds(data.regions.map((region) => region.id));
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function toggleValue(
    id: string,
    values: string[],
    update: (next: string[]) => void,
  ) {
    update(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.patch<EmployeeProfile>("/employees/profile/me", {
        description: description.trim(),
        specializationIds,
        regionIds,
      });
      setProfile(data);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.namedItem("file");
    if (!(file instanceof HTMLInputElement) || !file.files?.[0]) {
      setError("Оберіть фото або відео для завантаження.");
      return;
    }
    const body = new FormData();
    body.append("file", file.files[0]);
    if (caption.trim()) body.append("caption", caption.trim());

    setBusy(true);
    setError("");
    try {
      const { data } = await api.post<NonNullable<EmployeeProfile["portfolio"]>[number]>(
        "/employees/profile/me/media",
        body,
      );
      setProfile((current) =>
        current ? { ...current, portfolio: [...(current.portfolio ?? []), data] } : current,
      );
      setCaption("");
      form.reset();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(mediaId: string) {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/employees/profile/me/media/${encodeURIComponent(mediaId)}`);
      setProfile((current) =>
        current
          ? { ...current, portfolio: current.portfolio?.filter((item) => item.id !== mediaId) }
          : current,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel form-panel employee-editor">
      <h2>Профіль виконавця</h2>
      <p>Оновіть опис, послуги, регіони та приклади виконаних робіт.</p>
      {error && <ErrorBox text={error} />}
      {loading ? (
        <p>Завантаження профілю…</p>
      ) : (
        <>
          <form onSubmit={saveProfile}>
            <label className="field">
              <span>Про ваш досвід</span>
              <textarea
                required
                minLength={6}
                maxLength={2000}
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <fieldset>
              <legend>Послуги та спеціалізації</legend>
              {services.map((service) => (
                <label className="checkbox" key={service.id}>
                  <input
                    type="checkbox"
                    checked={specializationIds.includes(service.id)}
                    onChange={() => toggleValue(service.id, specializationIds, setSpecializationIds)}
                  />
                  {service.name}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Регіони роботи</legend>
              {regions.map((region) => (
                <label className="checkbox" key={region.id}>
                  <input
                    type="checkbox"
                    checked={regionIds.includes(region.id)}
                    onChange={() => toggleValue(region.id, regionIds, setRegionIds)}
                  />
                  {region.name}
                </label>
              ))}
            </fieldset>
            <button className="button primary" disabled={busy}>
              {busy ? "Збереження…" : "Зберегти профіль"}
            </button>
          </form>

          <h3 className="portfolio-heading">Портфоліо</h3>
          <form className="media-upload" onSubmit={uploadMedia}>
            <label className="field">
              <span>Фото або відео (до 50 МБ)</span>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                required
              />
            </label>
            <label className="field">
              <span>Підпис до роботи</span>
              <input
                value={caption}
                maxLength={500}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Наприклад, сезонне прибирання"
              />
            </label>
            <button className="button secondary" disabled={busy}>
              {busy ? "Завантаження…" : "Додати до портфоліо"}
            </button>
          </form>
          {!!profile?.portfolio?.length && (
            <div className="portfolio-grid">
              {profile.portfolio.map((media) => (
                <figure key={media.id}>
                  {media.type === "video" ? (
                    <video src={media.url} controls preload="metadata" />
                  ) : (
                    <img src={media.url} alt={media.caption ?? "Робота виконавця"} loading="lazy" />
                  )}
                  {media.caption && <figcaption>{media.caption}</figcaption>}
                  <button
                    className="media-delete"
                    disabled={busy}
                    onClick={() => void deleteMedia(media.id)}
                  >
                    Видалити
                  </button>
                </figure>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
