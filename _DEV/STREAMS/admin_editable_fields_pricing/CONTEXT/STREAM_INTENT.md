# Stream Intent: Admin Editable Fields and Pricing

## Goal

Make all required fields editable in the admin panel, remove default required status for make, brand, model, and age fields, and ensure pricing is editable at unit level (per appliance, per boiler) and at total level. Fix authentication persistence for hosted environment and ensure number input arrows work properly.

## Requirements

### 1. Required Fields Management
- Remove make, brand, model, and age as required fields by default
- All fields should be editable in admin panel
- Admin should be able to toggle required status for any field

### 2. Pricing Editability
- **Per Appliance**: Each appliance should have an editable monthly cost field
- **Per Boiler**: Boiler cost should be editable (currently only radio buttons)
- **Total Level**: Total cost should remain editable and functional

### 3. Number Input Fixes
- Number input fields should show increment/decrement arrows
- Arrows should be functional and allow editing
- Inputs should be properly editable

### 4. Authentication
- Change auth persistence from LOCAL to SESSION for hosted environment
- Console should not show "auth is set to local" message
- Everything should work properly in hosted environment

## Success Criteria

- [ ] Make, brand, model, and age fields are no longer required by default
- [ ] Pricing is editable at per-appliance level
- [ ] Pricing is editable at per-boiler level
- [ ] Total pricing is editable and working correctly
- [ ] Number input arrows are visible and functional
- [ ] Auth persistence is set to SESSION
- [ ] All changes work in hosted environment

## Technical Notes

- Form validation should only require appliance type, not make/brand/model/age
- Pricing calculations should update when individual costs change
- Total cost should allow manual override
- Number inputs need proper CSS to show arrows in all browsers
