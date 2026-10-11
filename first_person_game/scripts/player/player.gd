extends CharacterBody3D

@export var move_speed: float = 5.0

func _physics_process(_delta: float) -> void:
    var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
    var direction := (transform.basis * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()

    if direction:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, move_speed)
        velocity.z = move_toward(velocity.z, 0.0, move_speed)

    move_and_slide()
