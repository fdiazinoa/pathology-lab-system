-- Reject future birth dates at the API boundary as well as in the form.
alter table public.patients add constraint patients_birth_date_not_future check(birth_date is null or birth_date <= current_date);
