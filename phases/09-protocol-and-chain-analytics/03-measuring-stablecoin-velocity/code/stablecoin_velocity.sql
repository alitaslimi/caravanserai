with daily as (
  select c.day, c.asset_id, v.transfer_volume, s.circulating_supply, p.price,
         v.transfer_volume is not null and s.circulating_supply is not null and p.price is not null as complete
  from metric_calendar c
  left join daily_eligible_volume v using (day, asset_id)
  left join daily_supply s using (day, asset_id)
  left join daily_prices p using (day, asset_id)
)
select asset_id,
       sum(transfer_volume) / avg(circulating_supply * price) as period_turns,
       countIf(complete) as complete_days,
       count() as expected_days
from daily
group by asset_id;
