class Menu < ApplicationRecord
    has_many :days

    def as_json(options = {})
        {}.tap do |h|
            h[:id] = id
            h[:from] = from
            h[:to] = to
            h[:days] = days
            h[:created_at] = created_at
        end
    end
end
