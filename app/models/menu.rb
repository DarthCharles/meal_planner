class Menu < ApplicationRecord
  has_many :days, dependent: :destroy
  validates :people_count, positive_integer: true

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:people_count] = people_count
      h[:generation_notices] = generation_notices.map { |notice| GenerationNotice.render(notice) }
      h[:created_at] = created_at
      h[:days] = days
      h[:from] = from
      h[:to] = to
    end
  end
end
