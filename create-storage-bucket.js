const SUPABASE_URL = "https://ientovkdqwiqqlphqgrr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnRvdmtkcXdpcXFscGhxZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjA3MzUsImV4cCI6MjA5Nzg5NjczNX0.nwZvZNkK9uZfZk-oslYN2vAb8rmnVTqVd0r7kSPKgUE";

async function createStorageBucket() {
  console.log("Creating storage bucket 'uploads'...");

  try {
    // Create the bucket
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'uploads',
        name: 'uploads',
        public: true,
      }),
    });

    if (response.ok) {
      console.log("✓ Storage bucket 'uploads' created successfully!");
    } else if (response.status === 409) {
      console.log("✓ Storage bucket 'uploads' already exists!");
    } else {
      const error = await response.text();
      console.error("✗ Failed to create bucket:", error);
    }

    // Create RLS policies
    const policies = [
      {
        name: "Public Access",
        definition: {
          statement: "SELECT",
          table: "objects",
          roles: ["public", "authenticated"],
          using: "bucket_id = 'uploads'",
        },
      },
      {
        name: "Authenticated Upload",
        definition: {
          statement: "INSERT",
          table: "objects",
          roles: ["authenticated"],
          with_check: "bucket_id = 'uploads'",
        },
      },
      {
        name: "Authenticated Update",
        definition: {
          statement: "UPDATE",
          table: "objects",
          roles: ["authenticated"],
          using: "bucket_id = 'uploads'",
        },
      },
      {
        name: "Authenticated Delete",
        definition: {
          statement: "DELETE",
          table: "objects",
          roles: ["authenticated"],
          using: "bucket_id = 'uploads'",
        },
      },
    ];

    console.log("Setting up RLS policies...");
    for (const policy of policies) {
      const policyResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy_name: policy.name,
          table_name: policy.definition.table,
          policy_statement: policy.definition.statement,
          roles: policy.definition.roles,
          using: policy.definition.using,
          with_check: policy.definition.with_check,
        }),
      });
      console.log(`  ${policy.name}: ${policyResponse.ok ? '✓' : '✗'}`);
    }

    console.log("\n✓ Storage bucket setup complete!");
    console.log("Please restart your development server.");
  } catch (error) {
    console.error("Error:", error);
  }
}

createStorageBucket();
