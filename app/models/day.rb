class Day < ApplicationRecord
    belongs_to :menu
    has_many :meals
end
