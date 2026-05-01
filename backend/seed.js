const bcrypt = require('bcryptjs');

module.exports = async function seed() {
  const { User, Project, ProjectMember, Task, Comment, Activity, sequelize } = require('./models');

  try {
    console.log('🧹 Clearing existing data...');
    
    // Disable foreign key checks to allow truncation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete all data in correct order (due to foreign keys)
    await Comment.destroy({ where: {}, truncate: true, cascade: true });
    await Activity.destroy({ where: {}, truncate: true, cascade: true });
    await Task.destroy({ where: {}, truncate: true, cascade: true });
    await ProjectMember.destroy({ where: {}, truncate: true, cascade: true });
    await Project.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Database cleared');

    // Hash password
    const password = await bcrypt.hash('demo123', 12);

    // Create users
    console.log('👥 Creating users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskflow.app',
      password,
      avatar: '',
      isAdmin: true
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@taskflow.app',
      password,
      avatar: '',
      isAdmin: false
    });

    const user2 = await User.create({
      name: 'Sarah Smith',
      email: 'sarah@taskflow.app',
      password,
      avatar: '',
      isAdmin: false
    });

    const user3 = await User.create({
      name: 'Mike Johnson',
      email: 'mike@taskflow.app',
      password,
      avatar: '',
      isAdmin: false
    });

    console.log('✅ Users created:');
    console.log(`   👑 Admin: admin@taskflow.app / demo123`);
    console.log(`   👤 User 1: john@taskflow.app / demo123`);
    console.log(`   👤 User 2: sarah@taskflow.app / demo123`);
    console.log(`   👤 User 3: mike@taskflow.app / demo123`);

    // Create one sample project by admin
    const project = await Project.create({
      name: 'Team Project',
      description: 'Main team collaboration project',
      color: '#7c3aed',
      ownerId: admin.id,
      status: 'active'
    });

    console.log('✅ Project created: Team Project');

    // Add members to project with different roles
    await ProjectMember.bulkCreate([
      { projectId: project.id, userId: admin.id, role: 'admin' },
      { projectId: project.id, userId: user1.id, role: 'member' },
      { projectId: project.id, userId: user2.id, role: 'member' },
      { projectId: project.id, userId: user3.id, role: 'member' }
    ]);

    console.log('✅ Project members added (Admin + 3 Members)');

    // Create a simple task
    const task = await Task.create({
      title: 'Welcome Task',
      description: 'This is your first task. Edit or delete it anytime.',
      status: 'todo',
      priority: 'medium',
      projectId: project.id,
      assigneeId: user1.id,
      createdById: admin.id
    });

    console.log('✅ Sample task created');

    // Log initial activity
    await Activity.create({
      action: 'project_created',
      userId: admin.id,
      projectId: project.id,
      details: { projectName: 'Team Project' }
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎉 FRESH SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📊 Database Summary:');
    console.log('   Users: 4 (1 Admin + 3 Members)');
    console.log('   Projects: 1');
    console.log('   Tasks: 1');
    console.log('\n🔐 Role-Based Access Control:');
    console.log('\n   👑 ADMIN Permissions:');
    console.log('     ✓ Create/Edit/Delete projects');
    console.log('     ✓ Add/Remove members');
    console.log('     ✓ Change member roles');
    console.log('     ✓ Create/Update/Delete any task');
    console.log('     ✓ Manage team');
    console.log('\n   👤 MEMBER Permissions:');
    console.log('     ✓ Create/Update own tasks');
    console.log('     ✓ Update assigned tasks');
    console.log('     ✓ Add comments on tasks');
    console.log('     ✓ View all project data');
    console.log('     ✗ Cannot manage team');
    console.log('     ✗ Cannot delete projects');
    console.log('\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  }
};
