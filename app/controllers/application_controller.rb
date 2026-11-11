class ApplicationController < ActionController::API
  around_action :with_request_locale

  private

  def with_request_locale(&action)
    locale = request_locale
    response.set_header("Content-Language", locale.to_s)
    response.set_header("Vary", [response.get_header("Vary"), "Accept-Language"].compact.join(", "))
    I18n.with_locale(locale, &action)
  end

  def request_locale
    # Respect quality weights and regional tags without accepting arbitrary locales.
    preferences = request.headers["Accept-Language"].to_s.split(",").each_with_index.filter_map do |entry, index|
      tag, *parameters = entry.strip.downcase.split(";")
      quality = parameters.find { |parameter| parameter.strip.start_with?("q=") }
      weight = quality ? Float(quality.strip.delete_prefix("q="), exception: false) : 1.0
      code = tag.to_s.split("-").first
      [code.to_sym, weight, index] if %w[en es].include?(code) && weight && weight.positive? && weight <= 1
    end
    preferences.min_by { |_, weight, index| [-weight, index] }&.first || I18n.default_locale
  end
end
