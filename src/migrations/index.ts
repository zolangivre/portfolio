import * as migration_20260707_181717_initial from './20260707_181717_initial';
import * as migration_20260707_184348_add_journal from './20260707_184348_add_journal';
import * as migration_20260708_141432_add_sections_visibility from './20260708_141432_add_sections_visibility';
import * as migration_20260708_172129_add_categories from './20260708_172129_add_categories';
import * as migration_20260708_173629_add_social_link_icon from './20260708_173629_add_social_link_icon';
import * as migration_20260716_103500_add_project_cover_image_dark from './20260716_103500_add_project_cover_image_dark';
import * as migration_20260716_110000_order_ascending_semantics from './20260716_110000_order_ascending_semantics';
import * as migration_20260716_120000_add_invert_logo_in_dark_mode from './20260716_120000_add_invert_logo_in_dark_mode';
import * as migration_20260716_130000_hero_description_rich_text from './20260716_130000_hero_description_rich_text';
import * as migration_20260716_140000_add_about_contact_eyebrow from './20260716_140000_add_about_contact_eyebrow';
import * as migration_20260716_150000_add_sections_content from './20260716_150000_add_sections_content';
import * as migration_20260716_160000_about_point_groups from './20260716_160000_about_point_groups';
import * as migration_20260717_115341_about_point_groups_content from './20260717_115341_about_point_groups_content';
import * as migration_20260717_195308_description_fields_rich_text from './20260717_195308_description_fields_rich_text';
import * as migration_20260718_161700_add_cursor_effect from './20260718_161700_add_cursor_effect';
import * as migration_20260722_150000_add_project_visibility from './20260722_150000_add_project_visibility';

export const migrations = [
  {
    up: migration_20260707_181717_initial.up,
    down: migration_20260707_181717_initial.down,
    name: '20260707_181717_initial',
  },
  {
    up: migration_20260707_184348_add_journal.up,
    down: migration_20260707_184348_add_journal.down,
    name: '20260707_184348_add_journal',
  },
  {
    up: migration_20260708_141432_add_sections_visibility.up,
    down: migration_20260708_141432_add_sections_visibility.down,
    name: '20260708_141432_add_sections_visibility'
  },
  {
    up: migration_20260708_172129_add_categories.up,
    down: migration_20260708_172129_add_categories.down,
    name: '20260708_172129_add_categories'
  },
  {
    up: migration_20260708_173629_add_social_link_icon.up,
    down: migration_20260708_173629_add_social_link_icon.down,
    name: '20260708_173629_add_social_link_icon'
  },
  {
    up: migration_20260716_103500_add_project_cover_image_dark.up,
    down: migration_20260716_103500_add_project_cover_image_dark.down,
    name: '20260716_103500_add_project_cover_image_dark'
  },
  {
    up: migration_20260716_110000_order_ascending_semantics.up,
    down: migration_20260716_110000_order_ascending_semantics.down,
    name: '20260716_110000_order_ascending_semantics'
  },
  {
    up: migration_20260716_120000_add_invert_logo_in_dark_mode.up,
    down: migration_20260716_120000_add_invert_logo_in_dark_mode.down,
    name: '20260716_120000_add_invert_logo_in_dark_mode'
  },
  {
    up: migration_20260716_130000_hero_description_rich_text.up,
    down: migration_20260716_130000_hero_description_rich_text.down,
    name: '20260716_130000_hero_description_rich_text'
  },
  {
    up: migration_20260716_140000_add_about_contact_eyebrow.up,
    down: migration_20260716_140000_add_about_contact_eyebrow.down,
    name: '20260716_140000_add_about_contact_eyebrow'
  },
  {
    up: migration_20260716_150000_add_sections_content.up,
    down: migration_20260716_150000_add_sections_content.down,
    name: '20260716_150000_add_sections_content'
  },
  {
    up: migration_20260716_160000_about_point_groups.up,
    down: migration_20260716_160000_about_point_groups.down,
    name: '20260716_160000_about_point_groups'
  },
  {
    up: migration_20260717_115341_about_point_groups_content.up,
    down: migration_20260717_115341_about_point_groups_content.down,
    name: '20260717_115341_about_point_groups_content'
  },
  {
    up: migration_20260717_195308_description_fields_rich_text.up,
    down: migration_20260717_195308_description_fields_rich_text.down,
    name: '20260717_195308_description_fields_rich_text'
  },
  {
    up: migration_20260718_161700_add_cursor_effect.up,
    down: migration_20260718_161700_add_cursor_effect.down,
    name: '20260718_161700_add_cursor_effect'
  },
  {
    up: migration_20260722_150000_add_project_visibility.up,
    down: migration_20260722_150000_add_project_visibility.down,
    name: '20260722_150000_add_project_visibility'
  },
];
