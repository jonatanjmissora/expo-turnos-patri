mis pasos al momento de la migracion:

1- en el editor del supabase:
select
  'insert into expo_turnos (id, user_id, fecha, hora, duracion, nombre, tratamiento, is_depi, valor) values '
  || string_agg(
       format('(%L, %L::uuid, %L, %L, %L, %L, %L, %L, %L)',
         t.id::text,
         '56160dea-a38b-47aa-bd31-0b69e4328977',
         to_char(to_date(t.fecha::text, 'YYYYMMDD'), 'YYYY-MM-DD'),
         lpad(t.hora::text, 4, '0'),
         t.duracion::text,
         t.nombre,
         t.tratamiento,
         t.is_depi::text,
         t.valor::text
       ),
       ',' || chr(10)
     )
  || chr(10)
  || 'on conflict (id) do nothing;'
from turnos_patri t
where to_date(t.fecha::text, 'YYYYMMDD') >= current_date - interval '365 days';

2 - en el editor de neon:
delete from expo_turnos where user_id = '56160dea-a38b-47aa-bd31-0b69e4328977';

3 - copio el resultado de supabase y lo pego en neon.

4 - actualizo el userId con:
update expo_turnos set user_id = '<uuid real>'
where user_id = '56160dea-a38b-47aa-bd31-0b69e4328977';

5 - verificar que los datos se hayan cargado correctamente con:
select count(*) from expo_turnos;