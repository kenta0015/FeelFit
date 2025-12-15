## 🐛 2025-08-08 Supabase INSERT Error
### Issue:

When inserting a new user into the users table in Supabase, the following error occurred:
null value in column "name" violates not-null constraint

### Cause:

The name column had a NOT NULL constraint, but it was empty during initial registration.

### Solution:

Changed the name column to allow NULL values, which resolved the issue.

## Note:

If we want to enforce name as required in the future, we should implement empty field validation on the app side.

