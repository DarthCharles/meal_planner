class Menu < ApplicationRecord
  has_many :days, dependent: :destroy

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:generation_notices] = generation_notices
      h[:created_at] = created_at
      h[:days] = days
      h[:from] = from
      h[:to] = to
    end
  end
end
