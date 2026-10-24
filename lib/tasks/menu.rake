# frozen_string_literal: true

namespace :menu do
  desc "Generate weekly menu for next Monday–Sunday (run Sunday 06:00 UTC)"
  task generate: :environment do
    week_start = MenuGenerationService.next_monday(from: Time.current.utc)
    MenuGenerationService.new.call(week_start: week_start)
    puts "Created menu for #{week_start} – #{week_start + 6.days}"
  end
end
