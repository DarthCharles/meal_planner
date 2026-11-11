# A generation-time snapshot, rendered in the requesting language. User content
# remains unchanged, including after meals or preferences are edited later.
class GenerationNotice
  def self.render(notice)
    snapshot = notice.is_a?(Hash) ? notice : legacy_snapshot(notice)
    return notice unless snapshot

    I18n.t("menu.preference_notice",
      meal: snapshot.fetch("meal_name"),
      weekday: I18n.t("weekdays.#{snapshot.fetch('weekday')}"),
      preferred: snapshot.fetch("preferred_days").map { |day| I18n.t("weekdays.#{day}") }.join(", "))
  end

  def self.legacy_snapshot(notice)
    # Older versions stored English sentences. Recognize only the exact original
    # template; leave any other historical text intact.
    match = /\A(.+) was scheduled on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) to complete the menu; its preferred days are (.+)\.\z/m.match(notice.to_s)
    return unless match

    days = match[3].split(", ").map(&:downcase)
    return unless days.any? && days.all? { |day| Meal::WEEKDAY_NAMES.include?(day) }

    { "meal_name" => match[1], "weekday" => match[2].downcase, "preferred_days" => days }
  end
  private_class_method :legacy_snapshot
end
