import { officeHours } from "@/lib/site-data";
export function OfficeHours() {
  return (
    <div className="office-hours">
      <h3>Office hours</h3>
      <div className="office-hours-columns">
        {[officeHours.slice(0, 3), officeHours.slice(3)].map((days, index) => (
          <dl key={index}>
            {days.map((row) => (
              <div key={row.day}>
                <dt>{row.day}</dt>
                <dd>{row.hours}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
}
