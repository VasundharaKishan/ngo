package com.myfoundation.school.donationpreset.dto;

import com.myfoundation.school.donationpreset.DonationPreset;

import java.util.List;

/**
 * Public payload. The frontend gets the enabled, ordered list of preset amounts plus
 * the default amount to preselect. Returning an object (not just an array) gives us
 * room to add more fields later (currency, min/max overrides, etc.) without a breaking
 * contract change.
 */
public record PublicDonationPresetsResponse(
        List<Item> presets,
        Integer defaultAmountMinorUnits
) {
    public record Item(
            Long id,
            Integer amountMinorUnits,
            String label
    ) {
        public static Item from(DonationPreset p) {
            return new Item(p.getId(), p.getAmountMinorUnits(), p.getLabel());
        }
    }

    public static PublicDonationPresetsResponse from(List<DonationPreset> presets) {
        List<Item> items = presets.stream().map(Item::from).toList();
        Integer defaultAmount = presets.stream()
                .filter(DonationPreset::isDefault)
                .map(DonationPreset::getAmountMinorUnits)
                .findFirst()
                .orElse(null);
        return new PublicDonationPresetsResponse(items, defaultAmount);
    }
}
