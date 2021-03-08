class Menu < ApplicationRecord
  has_many :days

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:created_at] = created_at
      h[:days] = days
      h[:from] = from
      h[:to] = to
    end
  end
end
