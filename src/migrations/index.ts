import * as migration_20260707_181717_initial from './20260707_181717_initial';
import * as migration_20260707_184348_add_journal from './20260707_184348_add_journal';
import * as migration_20260708_141432_add_sections_visibility from './20260708_141432_add_sections_visibility';
import * as migration_20260708_172129_add_categories from './20260708_172129_add_categories';
import * as migration_20260708_173629_add_social_link_icon from './20260708_173629_add_social_link_icon';
import * as migration_20260716_103500_add_project_cover_image_dark from './20260716_103500_add_project_cover_image_dark';

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
];
