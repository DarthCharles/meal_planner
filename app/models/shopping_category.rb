# Fixed grocery departments. Labels belong to the client's translation catalogs.
module ShoppingCategory
  CODES = %w[produce meat deli dairy_eggs bakery_tortillas pantry frozen uncategorized].freeze

  def self.catalog
    CODES.each_with_index.map { |code, position| { code: code, position: position } }
  end
end
