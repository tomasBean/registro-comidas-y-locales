import { Link } from 'react-router-dom';
import { APP_NAME } from '../../config/app';
import { recentVisits } from '../../domain/visits';
import { buttonClassName } from '../../ui/components/Button';
import { Section, Stack } from '../../ui/components/Card';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { VisitCard } from '../visits/VisitCard';

const RECENT_LIMIT = 20;

export function HomeScreen() {
  return (
    <Page title={APP_NAME}>
      <LoadGate>
        {(dataset) => {
          const visits = recentVisits(dataset, RECENT_LIMIT);
          if (visits.length === 0) {
            return (
              <>
                <EmptyState title="Todavía no hay visitas" description="Cuando registres la primera, va a aparecer acá." />
                <Link to={routes.newVisit()} className={buttonClassName('primary', true)}>
                  Registrar visita
                </Link>
              </>
            );
          }
          return (
            <Section title="Últimas visitas">
              <Stack>
                {visits.map((detail) => (
                  <VisitCard key={detail.visit.id} detail={detail} showPlace />
                ))}
              </Stack>
            </Section>
          );
        }}
      </LoadGate>
    </Page>
  );
}
