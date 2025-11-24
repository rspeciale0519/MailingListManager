# Phase 0 Completion Checklist - Manual GitHub UI Tasks

This guide provides step-by-step instructions for completing the remaining Phase 0 configuration tasks that require GitHub's web interface.

## Task 0.1: GitHub Repository Configuration

### Step 1: Add Repository Description and Topics

1. Navigate to your repository: https://github.com/rspeciale0519/MailingListManager
2. Click the **Settings** icon (gear icon) in the top navigation
3. Scroll down to the **About** section on the right sidebar
4. Click the **gear icon** next to "About"
5. In the modal that appears:
   - **Description**: Enter: `Enterprise-grade SaaS platform for importing, cleaning, and managing large-scale mailing lists with advanced deduplication and enrichment.`
   - **Website**: (optional) `https://mailinglistmanager.com`
   - **Topics**: Add these tags (comma-separated or click to add):
     - `saas`
     - `mailing-list`
     - `contact-management`
     - `data-deduplication`
     - `typescript`
     - `react`
     - `fastify`
     - `postgresql`
6. Click **Save changes**

### Step 2: Configure Branch Protection Rules for `main`

1. Go to **Settings** → **Branches** (left sidebar)
2. Under "Branch protection rules", click **Add rule**
3. **Branch name pattern**: Enter `main`
4. Enable these options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from code owners
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Search for and select these status checks:
       - `check-file-sizes`
       - `lint`
       - `build-backend`
       - `build-frontend`
   - ✅ **Require linear history**
   - ✅ **Allow force pushes**: ❌ Do NOT enable (keep disabled)
   - ✅ **Allow deletions**: ❌ Do NOT enable (keep disabled)
   - ✅ **Require conversation resolution before merging**
5. Click **Create** or **Update** to save

### Step 3: Configure Branch Protection Rules for `develop`

1. Go to **Settings** → **Branches**
2. Click **Add rule** (if you want a second rule)
3. **Branch name pattern**: Enter `develop`
4. Enable these options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1` (or `0` if you want to allow self-merge for your own PRs)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Select the same status checks as main
   - ✅ **Allow force pushes**: ❌ Disable
   - ✅ **Allow deletions**: ❌ Disable
5. Click **Create** to save

### Step 4: Configure Branch Protection Rules for `staging`

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. **Branch name pattern**: Enter `staging`
4. Enable these options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `0` (staging can auto-merge from develop)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Select the same status checks
   - ✅ **Allow force pushes**: ❌ Disable
   - ✅ **Allow deletions**: ❌ Disable
5. Click **Create** to save

### Step 5: Configure Merge Commit Restrictions

1. Go to **Settings** → **General** (left sidebar)
2. Scroll to **Pull Requests** section
3. Under "Merge button", configure:
   - ❌ **Allow merge commits**: UNCHECK this
   - ✅ **Allow squash merging**: CHECK this
   - ✅ **Allow rebase merging**: CHECK this
4. For "Suggested pull request titles":
   - Select: **Commit or pull request title** (optional)
5. For "Delete head branch":
   - ✅ **Automatically delete head branches**: CHECK this
6. Scroll down and click **Save** if needed

---

## Task 0.5: Create GitHub Issue Labels

### Step 1: Access Labels Settings

1. Go to your repository
2. Click the **Issues** tab in the top navigation
3. Click **Labels** on the left sidebar (you may need to scroll)
   - Or go directly to: `https://github.com/rspeciale0519/MailingListManager/labels`

### Step 2: Create Priority Labels

Click **New label** and create these labels:

#### `priority: critical`

- **Name**: `priority: critical`
- **Description**: `Critical priority - blocks deployment, must be fixed immediately`
- **Color**: `#d73a49` (red)
- Click **Create label**

#### `priority: high`

- **Name**: `priority: high`
- **Description**: `High priority - should be completed in current sprint`
- **Color**: `#f97316` (orange)
- Click **Create label**

#### `priority: medium`

- **Name**: `priority: medium`
- **Description**: `Medium priority - should be completed in current or next sprint`
- **Color**: `#eab308` (yellow)
- Click **Create label**

#### `priority: low`

- **Name**: `priority: low`
- **Description**: `Low priority - nice to have, can be deferred`
- **Color**: `#22c55e` (green)
- Click **Create label**

### Step 3: Create Type Labels

#### `type: bug`

- **Name**: `type: bug`
- **Description**: `Something isn't working as expected`
- **Color**: `#d73a49` (red)
- Click **Create label**

#### `type: feature`

- **Name**: `type: feature`
- **Description**: `New functionality or enhancement`
- **Color**: `#0969da` (blue)
- Click **Create label**

#### `type: enhancement`

- **Name**: `type: enhancement`
- **Description**: `Improvement to existing functionality`
- **Color**: `#a371f7` (purple)
- Click **Create label**

#### `type: refactor`

- **Name**: `type: refactor`
- **Description**: `Code refactoring with no functional changes`
- **Color**: `#8b949e` (grey)
- Click **Create label**

#### `type: task`

- **Name**: `type: task`
- **Description**: `Routine task or maintenance work`
- **Color**: `#1f6feb` (dark blue)
- Click **Create label**

#### `type: docs`

- **Name**: `type: docs`
- **Description**: `Documentation updates or improvements`
- **Color**: `#7ee787` (light green)
- Click **Create label**

### Step 4: Create Status Labels

#### `status: blocked`

- **Name**: `status: blocked`
- **Description**: `Work is blocked by another task or external factor`
- **Color**: `#2d333b` (black)
- Click **Create label**

#### `status: in-progress`

- **Name**: `status: in-progress`
- **Description**: `Currently being worked on`
- **Color**: `#eab308` (yellow)
- Click **Create label**

#### `status: needs-review`

- **Name**: `status: needs-review`
- **Description**: `Ready for code review or feedback`
- **Color**: `#f97316` (orange)
- Click **Create label**

#### `status: ready`

- **Name**: `status: ready`
- **Description**: `Ready to be picked up and worked on`
- **Color**: `#0969da` (blue)
- Click **Create label**

### Step 5: Create Phase Labels

Create these labels for each development phase:

For each phase (0-9):

#### `phase-0` through `phase-9`

- **Name**: `phase-0` (or `phase-1`, `phase-2`, etc.)
- **Description**: `Phase 0: Project Setup & Infrastructure` (update for each phase)
- **Color**: Use different colors for each phase:
  - Phase 0: `#1f6feb` (dark blue)
  - Phase 1: `#0969da` (blue)
  - Phase 2: `#3fb950` (green)
  - Phase 3: `#22c55e` (light green)
  - Phase 4: `#eab308` (yellow)
  - Phase 5: `#f97316` (orange)
  - Phase 6: `#d73a49` (red)
  - Phase 7: `#a371f7` (purple)
  - Phase 8: `#8b949e` (grey)
  - Phase 9: `#6e40aa` (dark purple)
- Click **Create label**

### Step 6: Create Additional Labels

#### `dependencies`

- **Name**: `dependencies`
- **Description**: `Updates or changes to project dependencies`
- **Color**: `#1f6feb` (dark blue)
- Click **Create label**

#### `good first issue`

- **Name**: `good first issue`
- **Description**: `Good for newcomers or new contributors`
- **Color**: `#7ee787` (light green)
- Click **Create label**

#### `help wanted`

- **Name**: `help wanted`
- **Description**: `Extra attention is needed`
- **Color**: `#3fb950` (green)
- Click **Create label**

#### `performance`

- **Name**: `performance`
- **Description**: `Performance optimization or improvement`
- **Color**: `#f97316` (orange)
- Click **Create label**

#### `security`

- **Name**: `security`
- **Description**: `Security vulnerability or improvement`
- **Color**: `#d73a49` (red)
- Click **Create label**

---

## Task 0.6: Create GitHub Project Board

### Step 1: Create a New Project

1. Go to your repository
2. Click the **Projects** tab in the top navigation
3. Click **New project** (or the green button if no projects exist)
4. **Project name**: `Mailing List Manager Development`
5. **Description**: `Development roadmap and task tracking for the Mailing List Manager SaaS platform`
6. **Project template**: Select **Table** (more flexible than Kanban for this use case)
7. Click **Create project**

### Step 2: Configure Project Columns/Fields

The table template comes with default fields. Configure as follows:

**Key fields to ensure exist:**

- ✅ **Status** - (should exist by default)
  - Values: `Backlog`, `To Do`, `In Progress`, `In Review`, `Done`, `Blocked`
- ✅ **Priority** - (add if not present)
  - Values: `Low`, `Medium`, `High`, `Critical`
- ✅ **Phase** - (add if not present)
  - Values: `Phase 0`, `Phase 1`, `Phase 2`, ... `Phase 9`
- ✅ **Assignees** - (should exist by default)
- ✅ **Due Date** - (should exist by default)

**To add a custom field:**

1. Click the **+** icon in the column headers
2. Select **Custom field** or **Select a field**
3. Choose the field type (Single select, Date, etc.)
4. Set the field name and values
5. Click **Save**

### Step 3: Link Issues to Project

Issues can be auto-linked by:

1. Going to **Settings** (gear icon) in the project
2. Under "Templates", enable auto-add options
3. Or manually add issues by clicking **Add item** and selecting from your issues

### Step 4: Set Up Default View

1. The table view is good for tracking all details at once
2. You can also create a **Board** view:
   - Click **Create a view** (usually visible as a tab)
   - Name it: `Kanban Board`
   - Group by: **Status**
   - This creates a visual Kanban board grouped by status

### Step 5: Configure View Settings

For the board view:

1. Customize columns to show: Backlog, To Do, In Progress, In Review, Done
2. Cards can show: Title, Priority, Assignee, Phase
3. Save the view

---

## Additional Git Hook Configuration (via Code)

The remaining git hooks can be set up via code. Here's what's needed:

### Additional Hook: `commit-msg` (Enforce Conventional Commits)

This is typically handled by the `commitlint` package. The roadmap mentions this but it can be skipped if CI checks are enough.

### Additional Hook: `pre-push` (Run Tests)

This prevents pushing code with failing tests. Can be added to `.husky/pre-push`.

**Would you like me to implement these git hooks?** They require code changes and can be done while you're setting up the GitHub UI items.

---

## Summary Checklist

- [ ] **0.1.1** - Add repository description and topics
- [ ] **0.1.2** - Configure branch protection for `main`
- [ ] **0.1.3** - Configure branch protection for `develop`
- [ ] **0.1.4** - Configure branch protection for `staging`
- [ ] **0.1.5** - Configure merge commit restrictions
- [ ] **0.5.1-0.5.14** - Create all GitHub issue labels
- [ ] **0.6.1-0.6.5** - Create GitHub project board and configure fields

**Estimated time**: 30-45 minutes for all manual GitHub UI tasks

Once you complete these steps, Phase 0 will be **100% complete** (assuming I implement the remaining git hooks).
