# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed_origins = [
      'http://localhost:19006',
      %r{\Ahttp://(?:localhost|127\.0\.0\.1):\d+\z}
    ]
    if Rails.env.development? && ENV['DEV_CLIENT_ORIGIN'].present?
      allowed_origins << ENV.fetch('DEV_CLIENT_ORIGIN')
    end
    origins(*allowed_origins)

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
