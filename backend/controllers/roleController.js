const pool = require('../config/db');

// GET /api/roles/settings - Mengambil semua data untuk halaman pengaturan peran
exports.getRoleSettings = async (req, res, next) => {
    try {
        const rolesPromise = pool.query('SELECT id, name, description FROM roles ORDER BY id');
        const permissionsPromise = pool.query('SELECT id, action, group_name, description FROM permissions ORDER BY group_name, id');
        const rolePermissionsPromise = pool.query('SELECT role_id, permission_id FROM role_permissions');

        const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
            rolesPromise,
            permissionsPromise,
            rolePermissionsPromise
        ]);

        const roles = rolesResult.rows;
        const permissions = permissionsResult.rows;
        const rolePermissions = rolePermissionsResult.rows;

        const rolesWithPermissions = roles.map(role => {
            const assignedPermissionIds = rolePermissions
                .filter(rp => rp.role_id === role.id)
                .map(rp => rp.permission_id);
            return {
                ...role,
                permissionIds: assignedPermissionIds
            };
        });

        const permissionsByGroup = permissions.reduce((acc, permission) => {
            const group = permission.group_name;
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(permission);
            return acc;
        }, {});

        res.json({
            roles: rolesWithPermissions,
            permissions: permissionsByGroup
        });

    } catch (err) {
        next(err);
    }
};

// GET /api/roles - Mengambil semua nama peran yang tersedia
exports.getAllRoleNames = async (req, res, next) => {
    try {
        const query = `
            SELECT name FROM roles 
            ORDER BY CASE WHEN name = 'admin' THEN 0 WHEN name = 'manager' THEN 1 ELSE 2 END, name ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows.map(row => row.name));
    } catch (err) {
        next(err);
    }
};

// POST /api/roles - Membuat peran baru
exports.createRole = async (req, res, next) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nama peran wajib diisi.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            res.status(409);
            err.message = 'Nama peran sudah ada.';
        }
        next(err);
    }
};

// PUT /api/roles/:id/permissions - Memperbarui hak akses untuk sebuah peran
exports.updateRolePermissions = async (req, res, next) => {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds harus berupa array.' });
    }

    if (id === '1') {
        res.status(403);
        return next(new Error('Hak akses untuk peran "admin" tidak dapat diubah.'));
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

        if (permissionIds.length > 0) {
            const values = permissionIds.map((permissionId, index) => `($1, $${index + 2})`).join(',');
            const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
            await client.query(query, [id, ...permissionIds]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Hak akses berhasil diperbarui.' });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23503') {
            res.status(400);
            err.message = 'Satu atau lebih ID hak akses tidak valid.';
        }
        next(err);
    } finally {
        client.release();
    }
};

// DELETE /api/roles/:id - Menghapus peran
exports.deleteRole = async (req, res, next) => {
    const { id } = req.params;

    if (['1', '2', '3'].includes(id)) {
        res.status(403);
        return next(new Error('Peran dasar (admin, manager, staff) tidak dapat dihapus.'));
    }

    try {
        const userCheck = await pool.query('SELECT COUNT(*) FROM users WHERE role = (SELECT name FROM roles WHERE id = $1)', [id]);
        if (parseInt(userCheck.rows[0].count, 10) > 0) {
            res.status(409);
            throw new Error('Gagal menghapus. Masih ada pengguna yang menggunakan peran ini.');
        }

        const result = await pool.query('DELETE FROM roles WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Peran tidak ditemukan.' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};