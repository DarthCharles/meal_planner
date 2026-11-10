ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  # Keep local verification from competing with active development for CPU.
  parallelize(workers: 1)
end
